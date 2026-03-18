import type { Subject } from '../types';
import { mathsSubject } from './maths';
import { biologySubject } from './biology';
import { chemistrySubject } from './chemistry';
import { physicsSubject } from './physics';
import { historySubject } from './history';
import { englishSubject } from './english';

const subjects: Subject[] = [
  mathsSubject,
  biologySubject,
  chemistrySubject,
  physicsSubject,
  historySubject,
  englishSubject,
];

export function getAllSubjects(): Subject[] {
  return subjects;
}

export function getSubjectById(id: string): Subject | undefined {
  return subjects.find(s => s.id === id);
}
