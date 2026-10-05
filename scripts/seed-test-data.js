const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const envPath = path.join(__dirname, '..', '.env');
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
    }),
);

const GROUP_GRAMMAR = '11111111-1111-4111-8111-111111111111';
const GROUP_VOCAB = '22222222-2222-4222-8222-222222222222';
const ASSIGNMENT_GRAMMAR = '44444444-4444-4444-8444-444444444401';
const ASSIGNMENT_ESSAY = '44444444-4444-4444-8444-444444444402';
const MANAGER_ID = '66666666-6666-4666-8666-666666666601';
const STUDENT_ID = '66666666-6666-4666-8666-666666666602';
const COURSE_ID = '77777777-7777-4777-8777-777777777701';
const EXERCISE_ID = '88888888-8888-4888-8888-888888888801';
const LESSON_ID = '99999999-9999-4999-8999-999999999901';

const answer = (id, title, isCorrect = false) => ({ id, title, isCorrect });

const bankQuestions = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    question: '<p>She ___ to school every day.</p>',
    index: 1,
    type: 'MULTIPLE_CHOICE',
    group: GROUP_GRAMMAR,
    note: 'Chủ ngữ ngôi thứ ba số ít dùng goes.',
    answers: [
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'go'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', 'goes', true),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', 'going'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', 'went'),
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    question: '<p>They ___ football on Sundays.</p>',
    index: 2,
    type: 'MULTIPLE_CHOICE',
    group: GROUP_GRAMMAR,
    note: '',
    answers: [
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11', 'plays'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12', 'play', true),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa13', 'played'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14', 'playing'),
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    question: '<p>___ he live in Hanoi?</p>',
    index: 3,
    type: 'MULTIPLE_CHOICE',
    group: GROUP_GRAMMAR,
    note: '',
    answers: [
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa21', 'Do'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa22', 'Does', true),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa23', 'Is'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa24', 'Are'),
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333304',
    question: "<p>My mother's sister is my ___.</p>",
    index: 1,
    type: 'MULTIPLE_CHOICE',
    group: GROUP_VOCAB,
    note: '',
    answers: [
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa31', 'uncle'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa32', 'aunt', true),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa33', 'cousin'),
      answer('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa34', 'brother'),
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333305',
    question: '<p>Write 4 sentences about your daily routine.</p>',
    index: 4,
    type: 'ESSAY',
    group: GROUP_GRAMMAR,
    note: 'Dùng thì hiện tại đơn.',
    answers: null,
  },
  {
    id: '33333333-3333-4333-8333-333333333306',
    question: '<p>Describe your family in 5 sentences.</p>',
    index: 2,
    type: 'ESSAY',
    group: GROUP_VOCAB,
    note: '',
    answers: null,
  },
];

async function main() {
  const connection = await mysql.createConnection({
    host: env.MYSQL_HOST,
    port: Number(env.MYSQL_PORT),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASS,
    database: env.MYSQL_DATABASE,
  });

  const rounds = Number(env.BCRYPT_SALT_ROUNDS) || 12;
  const managerPassword = await bcrypt.hash('Manager@123', rounds);
  const studentPassword = await bcrypt.hash('Student@123', rounds);

  await connection.query(
    `INSERT INTO user (id, name, username, email, password, status, role)
     VALUES (?, 'Đinh Quỳnh Anh', 'manager', 'manager@abuenglish.local', ?, 'ACTIVE', 'MANAGER')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [MANAGER_ID, managerPassword],
  );
  await connection.query(
    `INSERT INTO user (id, name, username, email, password, status, role)
     VALUES (?, 'Nguyễn Minh Học', 'student', 'student@abuenglish.local', ?, 'ACTIVE', 'STUDENT')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [STUDENT_ID, studentPassword],
  );

  await connection.query(
    `INSERT INTO question_group (id, name, description, status)
     VALUES (?, 'Ngữ pháp hiện tại đơn', 'Câu hỏi về thì hiện tại đơn.', 'PUBLIC')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [GROUP_GRAMMAR],
  );
  await connection.query(
    `INSERT INTO question_group (id, name, description, status)
     VALUES (?, 'Từ vựng gia đình', 'Câu hỏi về từ vựng chủ đề gia đình.', 'PUBLIC')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [GROUP_VOCAB],
  );

  for (const item of bankQuestions) {
    await connection.query(
      `INSERT INTO question (id, question, \`index\`, answers, note, type, questionGroup, \`group\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE question = VALUES(question)`,
      [
        item.id,
        item.question,
        item.index,
        item.answers ? JSON.stringify(item.answers) : null,
        item.note,
        item.type,
        item.group,
        item.group,
      ],
    );
  }

  await connection.query(
    `INSERT INTO assignment (id, name, type, arrange, status)
     VALUES (?, 'Bài tập hiện tại đơn', 'MULTIPLE_CHOICE', 'ORDER', 'PUBLIC')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [ASSIGNMENT_GRAMMAR],
  );
  await connection.query(
    `INSERT INTO assignment (id, name, type, arrange, status)
     VALUES (?, 'Bài tập viết về gia đình', 'ESSAY', 'RANDOM', 'PUBLIC')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [ASSIGNMENT_ESSAY],
  );

  const copies = [
    ['55555555-5555-4555-8555-555555555501', '33333333-3333-4333-8333-333333333301', ASSIGNMENT_GRAMMAR, 1],
    ['55555555-5555-4555-8555-555555555502', '33333333-3333-4333-8333-333333333302', ASSIGNMENT_GRAMMAR, 2],
    ['55555555-5555-4555-8555-555555555503', '33333333-3333-4333-8333-333333333303', ASSIGNMENT_GRAMMAR, 3],
    ['55555555-5555-4555-8555-555555555504', '33333333-3333-4333-8333-333333333306', ASSIGNMENT_ESSAY, 1],
  ];

  for (const [id, sourceId, assignmentId, index] of copies) {
    const source = bankQuestions.find((item) => item.id === sourceId);
    await connection.query(
      `INSERT INTO question (id, question, \`index\`, answers, note, type, sourceQuestionId, assignment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE question = VALUES(question)`,
      [
        id,
        source.question,
        index,
        source.answers ? JSON.stringify(source.answers) : null,
        source.note,
        source.type,
        sourceId,
        assignmentId,
      ],
    );
  }

  await connection.query(
    `INSERT INTO course (id, name, description, retailPrice, sellingPrice, status, level, manager)
     VALUES (?, 'Khóa Tiếng Anh Cơ Bản 1', 'Khóa học thử để kiểm tra luồng bài tập.', 1500000, 799000, 'PUBLIC', 'LOW', ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [COURSE_ID, MANAGER_ID],
  );
  await connection.query(
    `INSERT INTO exercise (id, name, description, status, videoDuration, course)
     VALUES (?, 'Bài 1: Hiện tại đơn', 'Làm quen thì hiện tại đơn.', 'PUBLIC', 0, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [EXERCISE_ID, COURSE_ID],
  );
  await connection.query(
    `INSERT INTO lesson (id, name, type, arrange, status, \`index\`, exercise, sourceAssignment)
     VALUES (?, 'Bài tập hiện tại đơn', 'MULTIPLE_CHOICE', 'ORDER', 'PUBLIC', 1, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [LESSON_ID, EXERCISE_ID, ASSIGNMENT_GRAMMAR],
  );

  const lessonCopies = [
    ['55555555-5555-4555-8555-555555555511', '33333333-3333-4333-8333-333333333301', 1],
    ['55555555-5555-4555-8555-555555555512', '33333333-3333-4333-8333-333333333302', 2],
    ['55555555-5555-4555-8555-555555555513', '33333333-3333-4333-8333-333333333303', 3],
  ];
  for (const [id, sourceId, index] of lessonCopies) {
    const source = bankQuestions.find((item) => item.id === sourceId);
    await connection.query(
      `INSERT INTO question (id, question, \`index\`, answers, note, type, sourceQuestionId, lesson)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE question = VALUES(question)`,
      [
        id,
        source.question,
        index,
        source.answers ? JSON.stringify(source.answers) : null,
        source.note,
        source.type,
        sourceId,
        LESSON_ID,
      ],
    );
  }

  await connection.query(
    `INSERT IGNORE INTO course_users_user (courseId, userId) VALUES (?, ?)`,
    [COURSE_ID, STUDENT_ID],
  );
  await connection.query(
    `INSERT IGNORE INTO user_courses_course (userId, courseId) VALUES (?, ?)`,
    [STUDENT_ID, COURSE_ID],
  );
  await connection.query(
    `INSERT INTO userExercise (id, \`user\`, exercise, isPass)
     VALUES ('aaaaaaaa-1111-4111-8111-111111111101', ?, ?, 0)
     ON DUPLICATE KEY UPDATE \`user\` = VALUES(\`user\`)`,
    [STUDENT_ID, EXERCISE_ID],
  );
  await connection.query(
    `INSERT INTO userLesson (id, \`user\`, lesson, isPass)
     VALUES ('aaaaaaaa-1111-4111-8111-111111111102', ?, ?, 0)
     ON DUPLICATE KEY UPDATE \`user\` = VALUES(\`user\`)`,
    [STUDENT_ID, LESSON_ID],
  );

  const [rows] = await connection.query(
    `SELECT 'user' AS name, COUNT(*) AS total FROM user
     UNION ALL SELECT 'question_group', COUNT(*) FROM question_group
     UNION ALL SELECT 'question', COUNT(*) FROM question
     UNION ALL SELECT 'assignment', COUNT(*) FROM assignment
     UNION ALL SELECT 'course', COUNT(*) FROM course
     UNION ALL SELECT 'exercise', COUNT(*) FROM exercise
     UNION ALL SELECT 'lesson', COUNT(*) FROM lesson`,
  );
  console.log(rows.map((row) => `${row.name}=${row.total}`).join(', '));
  await connection.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
