import {
  EAssignmentStatus,
  ELessonArrange,
  ELessonType,
  EQuestionGroupStatus,
} from 'src/common/enums';

const now = '2026-10-02T00:00:00.000Z';

export const STATIC_GROUP_GRAMMAR_ID = '11111111-1111-4111-8111-111111111111';
export const STATIC_GROUP_VOCAB_ID = '22222222-2222-4222-8222-222222222222';
export const STATIC_ASSIGNMENT_GRAMMAR_ID = '44444444-4444-4444-8444-444444444401';
export const STATIC_ASSIGNMENT_ESSAY_ID = '44444444-4444-4444-8444-444444444402';

const answer = (id: string, title: string, isCorrect = false) => ({
  id,
  title,
  isCorrect,
});

export const staticQuestionGroups = [
  {
    id: STATIC_GROUP_GRAMMAR_ID,
    name: 'Ngữ pháp hiện tại đơn',
    description: 'Câu hỏi mẫu về thì hiện tại đơn.',
    status: EQuestionGroupStatus.PUBLIC,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: STATIC_GROUP_VOCAB_ID,
    name: 'Từ vựng gia đình',
    description: 'Câu hỏi mẫu về từ vựng chủ đề gia đình.',
    status: EQuestionGroupStatus.PUBLIC,
    createdAt: now,
    updatedAt: now,
  },
];

export const staticBankQuestions = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    question: '<p>She ___ to school every day.</p>',
    index: 1,
    answers: [
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'go'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', 'goes', true),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', 'going'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', 'went'),
    ],
    note: 'Chủ ngữ ngôi thứ ba số ít dùng goes.',
    type: ELessonType.MULTIPLE_CHOICE,
    createdAt: now,
    updatedAt: now,
    group: { id: STATIC_GROUP_GRAMMAR_ID, name: 'Ngữ pháp hiện tại đơn' },
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    question: '<p>They ___ football on Sundays.</p>',
    index: 2,
    answers: [
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11', 'plays'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12', 'play', true),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa13', 'played'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14', 'playing'),
    ],
    note: '',
    type: ELessonType.MULTIPLE_CHOICE,
    createdAt: now,
    updatedAt: now,
    group: { id: STATIC_GROUP_GRAMMAR_ID, name: 'Ngữ pháp hiện tại đơn' },
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    question: '<p>___ he live in Hanoi?</p>',
    index: 3,
    answers: [
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa21', 'Do'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa22', 'Does', true),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa23', 'Is'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa24', 'Are'),
    ],
    note: '',
    type: ELessonType.MULTIPLE_CHOICE,
    createdAt: now,
    updatedAt: now,
    group: { id: STATIC_GROUP_GRAMMAR_ID, name: 'Ngữ pháp hiện tại đơn' },
  },
  {
    id: '33333333-3333-4333-8333-333333333304',
    question: '<p>My mother\'s sister is my ___.</p>',
    index: 1,
    answers: [
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa31', 'uncle'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa32', 'aunt', true),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa33', 'cousin'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa34', 'brother'),
    ],
    note: '',
    type: ELessonType.MULTIPLE_CHOICE,
    createdAt: now,
    updatedAt: now,
    group: { id: STATIC_GROUP_VOCAB_ID, name: 'Từ vựng gia đình' },
  },
  {
    id: '33333333-3333-4333-8333-333333333305',
    question: '<p>Write 4 sentences about your daily routine.</p>',
    index: 4,
    answers: null,
    note: 'Dùng thì hiện tại đơn.',
    type: ELessonType.ESSAY,
    createdAt: now,
    updatedAt: now,
    group: { id: STATIC_GROUP_GRAMMAR_ID, name: 'Ngữ pháp hiện tại đơn' },
  },
  {
    id: '33333333-3333-4333-8333-333333333306',
    question: '<p>Describe your family in 5 sentences.</p>',
    index: 2,
    answers: null,
    note: '',
    type: ELessonType.ESSAY,
    createdAt: now,
    updatedAt: now,
    group: { id: STATIC_GROUP_VOCAB_ID, name: 'Từ vựng gia đình' },
  },
];

const cloneQuestion = (sourceId: string, copyId: string, index: number) => {
  const source = staticBankQuestions.find((item) => item.id === sourceId);
  return {
    id: copyId,
    question: source.question,
    index,
    note: source.note,
    answers: source.answers,
    type: source.type,
    sourceQuestionId: source.id,
  };
};

export const staticAssignments = [
  {
    id: STATIC_ASSIGNMENT_GRAMMAR_ID,
    name: 'Bài tập hiện tại đơn',
    type: ELessonType.MULTIPLE_CHOICE,
    arrange: ELessonArrange.ORDER,
    status: EAssignmentStatus.PUBLIC,
    createdAt: now,
    updatedAt: now,
    questions: [
      cloneQuestion(
        '33333333-3333-4333-8333-333333333301',
        '55555555-5555-4555-8555-555555555501',
        1,
      ),
      cloneQuestion(
        '33333333-3333-4333-8333-333333333302',
        '55555555-5555-4555-8555-555555555502',
        2,
      ),
      cloneQuestion(
        '33333333-3333-4333-8333-333333333303',
        '55555555-5555-4555-8555-555555555503',
        3,
      ),
    ],
  },
  {
    id: STATIC_ASSIGNMENT_ESSAY_ID,
    name: 'Bài tập viết về gia đình',
    type: ELessonType.ESSAY,
    arrange: ELessonArrange.RANDOM,
    status: EAssignmentStatus.PUBLIC,
    createdAt: now,
    updatedAt: now,
    questions: [
      cloneQuestion(
        '33333333-3333-4333-8333-333333333306',
        '55555555-5555-4555-8555-555555555504',
        1,
      ),
    ],
  },
];

export const paginateStatic = <T>(items: T[], page?: string, pageSize?: string) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const size = Math.max(Number(pageSize) || 10, 1);
  const start = (currentPage - 1) * size;

  return {
    data: items.slice(start, start + size),
    paginate: {
      page: currentPage,
      pageSize: size,
      total: items.length,
    },
  };
};

export const matchSearch = (value: string, search?: string) => {
  if (!search) return true;
  return value.toLowerCase().includes(search.toLowerCase());
};
