import { PowerUp } from 'knowin/common';

export interface IPowerUpCount {
  extra_life_joker: number;
  two_answer: number;
  pass_question: number;
  fifty_fifty: number;
  key: number;
}
export const powerUpList = new Map<PowerUp, IPowerUpCount>([
  [
    'atom_package',
    {
      extra_life_joker: 40,
      two_answer: 40,
      pass_question: 40,
      fifty_fifty: 40,
      key: 25,
    },
  ],
  [
    'giant_package',
    {
      extra_life_joker: 20,
      two_answer: 20,
      pass_question: 20,
      fifty_fifty: 20,
      key: 15,
    },
  ],
  [
    'rich_package',
    {
      extra_life_joker: 15,
      two_answer: 15,
      pass_question: 15,
      fifty_fifty: 15,
      key: 10,
    },
  ],
  [
    'medium_package',
    {
      extra_life_joker: 10,
      two_answer: 10,
      pass_question: 10,
      fifty_fifty: 10,
      key: 6,
    },
  ],
  [
    'mini_package',
    {
      extra_life_joker: 6,
      two_answer: 6,
      pass_question: 6,
      fifty_fifty: 6,
      key: 3,
    },
  ],
  [
    'standard_package',
    {
      extra_life_joker: 2,
      two_answer: 2,
      pass_question: 2,
      fifty_fifty: 2,
      key: 1,
    },
  ],
  [
    'one_extra_life_joker',
    {
      extra_life_joker: 1,
      two_answer: 0,
      pass_question: 0,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'three_extra_life_joker',
    {
      extra_life_joker: 3,
      two_answer: 0,
      pass_question: 0,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'five_extra_life_joker',
    {
      extra_life_joker: 5,
      two_answer: 0,
      pass_question: 0,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'ten_extra_life_joker',
    {
      extra_life_joker: 10,
      two_answer: 0,
      pass_question: 0,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'fifteen_extra_life_joker',
    {
      extra_life_joker: 15,
      two_answer: 0,
      pass_question: 0,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'one_pass_question',
    {
      extra_life_joker: 0,
      two_answer: 0,
      pass_question: 1,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'three_pass_question',
    {
      extra_life_joker: 0,
      two_answer: 0,
      pass_question: 3,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'five_pass_question',
    {
      extra_life_joker: 0,
      two_answer: 0,
      pass_question: 5,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'ten_pass_question',
    {
      extra_life_joker: 0,
      two_answer: 0,
      pass_question: 10,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'fifteen_pass_question',
    {
      extra_life_joker: 0,
      two_answer: 0,
      pass_question: 15,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'one_two_answer',
    {
      extra_life_joker: 0,
      two_answer: 1,
      pass_question: 0,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'three_two_answer',
    {
      extra_life_joker: 0,
      two_answer: 3,
      pass_question: 0,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'five_two_answer',
    {
      extra_life_joker: 0,
      two_answer: 5,
      pass_question: 0,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'ten_two_answer',
    {
      extra_life_joker: 0,
      two_answer: 10,
      pass_question: 0,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'fifteen_two_answer',
    {
      extra_life_joker: 0,
      two_answer: 15,
      pass_question: 0,
      fifty_fifty: 0,
      key: 0,
    },
  ],
  [
    'one_fifty_fifty',
    {
      extra_life_joker: 0,
      two_answer: 0,
      pass_question: 0,
      fifty_fifty: 1,
      key: 0,
    },
  ],
  [
    'three_fifty_fifty',
    {
      extra_life_joker: 0,
      two_answer: 0,
      pass_question: 0,
      fifty_fifty: 3,
      key: 0,
    },
  ],
  [
    'five_fifty_fifty',
    {
      extra_life_joker: 0,
      two_answer: 0,
      pass_question: 0,
      fifty_fifty: 5,
      key: 0,
    },
  ],
  [
    'ten_fifty_fifty',
    {
      extra_life_joker: 0,
      two_answer: 0,
      pass_question: 0,
      fifty_fifty: 10,
      key: 0,
    },
  ],
  [
    'fifteen_fifty_fifty',
    {
      extra_life_joker: 0,
      two_answer: 0,
      pass_question: 0,
      fifty_fifty: 15,
      key: 0,
    },
  ],
]);

export const isAPack = (id: PowerUp) => {
  return powerUpList.has(id);
};

export const getPowerUpFromPacks = (id: PowerUp) => {
  if (isAPack(id)) {
    return powerUpList.get(id);
  }

  throw new Error('Requested powerup not found!');
};
