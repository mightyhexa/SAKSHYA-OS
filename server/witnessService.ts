import { doc, getDoc, setDoc } from 'firebase/firestore';
import { serverDb } from './firebaseServer';

export interface WitnessPostResult {
  success: boolean;
  status: 'UNINITIALIZED_LEDGER' | 'MISSING_CREDENTIALS' | 'SIMULATED_WITNESS' | 'POSTED_EXTERNAL';
  message: string;
  headHash: string | null;
  witnesses: {
    police: { status: string; hash?: string; timestamp?: string };
    forensic: { status: string; hash?: string; timestamp?: string };
    court: { status: string; hash?: string; timestamp?: string };
    githubWitnessRepo?: { status: string; repo?: string; error?: string; commitUrl?: string };
  };
}

export async function postCurrentLedgerHead(): Promise<WitnessPostResult> {
  // 1. Fetch current ledger head from Firestore (Stage 2 ledgerHead doc)
  let headHash: string | null = null;
  let blockIndex = -1;

  try {
    const headDocRef = doc(serverDb, 'ledgerHead', 'current');
    const headSnap = await getDoc(headDocRef);
    if (headSnap.exists()) {
      const data = headSnap.data();
      headHash = data.headHash || data.hash || null;
      blockIndex = data.index ?? -1;
    }
  } catch (err: any) {
    console.warn('Could not read ledgerHead document:', err?.message);
  }

  // If Stage 2 has not run yet, ledger head is uninitialized
  if (!headHash) {
    return {
      success: false,
      status: 'UNINITIALIZED_LEDGER',
      message:
        'Custody ledger has not been initialized with a Genesis block yet (scheduled for Stage 2 per PRD FR4). No ledger head hash exists to post.',
      headHash: null,
      witnesses: {
        police: { status: 'AWAITING_GENESIS_BLOCK' },
        forensic: { status: 'AWAITING_GENESIS_BLOCK' },
        court: { status: 'AWAITING_GENESIS_BLOCK' },
        githubWitnessRepo: {
          status: 'SKIPPED',
          error: 'No ledger head hash available to commit.',
        },
      },
    };
  }

  const now = new Date().toISOString();

  // 2. Broadcast to simulated multi-node witnesses (FR9: Police, Forensic Lab, Court)
  try {
    await Promise.all([
      setDoc(doc(serverDb, 'witnesses_police', 'head'), { headHash, blockIndex, updatedAt: now }),
      setDoc(doc(serverDb, 'witnesses_forensic', 'head'), { headHash, blockIndex, updatedAt: now }),
      setDoc(doc(serverDb, 'witnesses_court', 'head'), { headHash, blockIndex, updatedAt: now }),
    ]);
  } catch (err: any) {
    console.warn('Error updating simulated witness nodes:', err?.message);
  }

  // 3. Check for external GitHub witness credentials (PRD Section 4 & FR9)
  const token = process.env.GITHUB_TOKEN?.trim();
  const repo = process.env.WITNESS_REPO?.trim();

  if (!token || !repo) {
    return {
      success: true,
      status: 'SIMULATED_WITNESS',
      message:
        'Ledger head hash recorded across simulated witness nodes (Police, Forensic Lab, Court). External GitHub posting skipped because GITHUB_TOKEN or WITNESS_REPO environment variables are not configured.',
      headHash,
      witnesses: {
        police: { status: 'RECORDED', hash: headHash, timestamp: now },
        forensic: { status: 'RECORDED', hash: headHash, timestamp: now },
        court: { status: 'RECORDED', hash: headHash, timestamp: now },
        githubWitnessRepo: {
          status: 'UNCONFIGURED',
          repo: repo || undefined,
          error: 'Missing GITHUB_TOKEN or WITNESS_REPO in environment secrets.',
        },
      },
    };
  }

  // 4. If credentials exist, post to GitHub witness repository via GitHub REST API
  try {
    const filePath = `witness_log_${new Date().toISOString().split('T')[0]}.json`;
    const apiUrl = `https://api.github.com/repos/${repo}/contents/witness_head.json`;

    // Check if file already exists to get SHA for update
    let existingSha: string | undefined;
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'SAKSHYA-OS-Witness/1.0',
      },
    });

    if (getRes.ok) {
      const getJson = await getRes.json();
      existingSha = getJson.sha;
    }

    const payloadContent = JSON.stringify(
      {
        system: 'SAKSHYA OS',
        problemStatement: 'SIH26190',
        headHash,
        blockIndex,
        timestamp: now,
        witnessProof: 'External Repository Seal',
      },
      null,
      2
    );

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'SAKSHYA-OS-Witness/1.0',
      },
      body: JSON.stringify({
        message: `SAKSHYA OS: Witness seal block #${blockIndex} [${headHash.slice(0, 10)}]`,
        content: Buffer.from(payloadContent).toString('base64'),
        sha: existingSha,
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return {
        success: false,
        status: 'SIMULATED_WITNESS',
        message: `GitHub API error: ${putRes.status} ${putRes.statusText}`,
        headHash,
        witnesses: {
          police: { status: 'RECORDED', hash: headHash, timestamp: now },
          forensic: { status: 'RECORDED', hash: headHash, timestamp: now },
          court: { status: 'RECORDED', hash: headHash, timestamp: now },
          githubWitnessRepo: {
            status: 'FAILED',
            repo,
            error: errText,
          },
        },
      };
    }

    const putJson = await putRes.json();
    return {
      success: true,
      status: 'POSTED_EXTERNAL',
      message: `Ledger head hash successfully committed to external witness repository ${repo}.`,
      headHash,
      witnesses: {
        police: { status: 'RECORDED', hash: headHash, timestamp: now },
        forensic: { status: 'RECORDED', hash: headHash, timestamp: now },
        court: { status: 'RECORDED', hash: headHash, timestamp: now },
        githubWitnessRepo: {
          status: 'COMMITTED',
          repo,
          commitUrl: putJson?.commit?.html_url,
        },
      },
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'SIMULATED_WITNESS',
      message: `Failed posting to external repository: ${err?.message || String(err)}`,
      headHash,
      witnesses: {
        police: { status: 'RECORDED', hash: headHash, timestamp: now },
        forensic: { status: 'RECORDED', hash: headHash, timestamp: now },
        court: { status: 'RECORDED', hash: headHash, timestamp: now },
        githubWitnessRepo: {
          status: 'ERROR',
          repo,
          error: err?.message,
        },
      },
    };
  }
}
