import { doc, setDoc, getDocs, deleteDoc, collection, query, where } from 'firebase/firestore';
import { serverDb } from './firebaseServer';

export interface StorageAdapter {
  put(
    key: string,
    data: Buffer,
    metadata?: Record<string, any>
  ): Promise<{ storageRef: string; partCount: number; totalBytes: number }>;
  get(storageRef: string): Promise<Buffer>;
  delete(storageRef: string): Promise<void>;
}

/**
 * FirestoreChunkStorage
 *
 * Implements chunked storage for encrypted binary files in Google Cloud Firestore.
 * Slices large ciphertext into parts of <= 500KB and stores them as documents
 * inside the `blobs` collection to adhere strictly to Firestore 1MB limits.
 */
export class FirestoreChunkStorage implements StorageAdapter {
  // Max binary payload per document: 350 KB (~466 KB base64 string, strictly <= 500 KB limit)
  private readonly CHUNK_SIZE_BYTES = 350 * 1024;

  async put(
    key: string,
    data: Buffer,
    metadata: Record<string, any> = {}
  ): Promise<{ storageRef: string; partCount: number; totalBytes: number }> {
    const storageRef = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    const totalParts = Math.max(1, Math.ceil(data.length / this.CHUNK_SIZE_BYTES));
    const now = new Date().toISOString();

    for (let partIndex = 0; partIndex < totalParts; partIndex++) {
      const start = partIndex * this.CHUNK_SIZE_BYTES;
      const end = Math.min(start + this.CHUNK_SIZE_BYTES, data.length);
      const partSlice = data.subarray(start, end);

      const blobDocId = `${storageRef}_part_${partIndex}`;
      const blobRef = doc(serverDb, 'blobs', blobDocId);

      const blobData: Record<string, any> = {
        id: blobDocId,
        storageRef,
        partIndex,
        totalParts,
        size: partSlice.length,
        data: partSlice.toString('base64'),
        createdAt: now,
      };

      if (partIndex === 0 && metadata && Object.keys(metadata).length > 0) {
        blobData.metadata = metadata;
      }

      await setDoc(blobRef, blobData);
    }

    return {
      storageRef,
      partCount: totalParts,
      totalBytes: data.length,
    };
  }

  async get(storageRef: string): Promise<Buffer> {
    const blobsQuery = query(
      collection(serverDb, 'blobs'),
      where('storageRef', '==', storageRef)
    );
    const snapshot = await getDocs(blobsQuery);

    if (snapshot.empty) {
      throw new Error(`Storage payload not found for reference: ${storageRef}`);
    }

    const parts: { partIndex: number; data: string }[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      parts.push({
        partIndex: d.partIndex,
        data: d.data,
      });
    });

    // Sort parts sequentially by partIndex
    parts.sort((a, b) => a.partIndex - b.partIndex);

    const buffers: Buffer[] = parts.map((p) => Buffer.from(p.data, 'base64'));
    return Buffer.concat(buffers);
  }

  async delete(storageRef: string): Promise<void> {
    const blobsQuery = query(
      collection(serverDb, 'blobs'),
      where('storageRef', '==', storageRef)
    );
    const snapshot = await getDocs(blobsQuery);

    const deletePromises: Promise<void>[] = [];
    snapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(docSnap.ref));
    });

    await Promise.all(deletePromises);
  }
}

// Global default storage adapter instance
export const defaultStorageAdapter: StorageAdapter = new FirestoreChunkStorage();
