/**
 * MigrationOps — Wave Planning Controller
 */

import { getRepositories } from '../repositories';
import { MigrationWave, WorkloadWithAssessment } from '../types';

export interface WaveData {
  'Wave 1': WorkloadWithAssessment[];
  'Wave 2': WorkloadWithAssessment[];
  'Wave 3': WorkloadWithAssessment[];
  unassigned: WorkloadWithAssessment[];
}

export interface WaveSummary {
  'Wave 1': number;
  'Wave 2': number;
  'Wave 3': number;
  unassigned: number;
  total: number;
}

export async function getWaves(): Promise<{ data: WaveData; summary: WaveSummary }> {
  const workloads = await getRepositories().getWorkloadsWithAssessments();

  const waves: WaveData = {
    'Wave 1': [],
    'Wave 2': [],
    'Wave 3': [],
    unassigned: [],
  };

  for (const w of workloads) {
    const wave = w.assessment?.wave as MigrationWave | undefined;
    if (wave && wave in waves) {
      waves[wave].push(w);
    } else {
      waves.unassigned.push(w);
    }
  }

  return {
    data: waves,
    summary: {
      'Wave 1': waves['Wave 1'].length,
      'Wave 2': waves['Wave 2'].length,
      'Wave 3': waves['Wave 3'].length,
      unassigned: waves.unassigned.length,
      total: workloads.length,
    },
  };
}
