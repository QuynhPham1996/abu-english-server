const fs = require('fs');
const path = require('path');
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
const ASSIGNMENT_GRAMMAR = '44444444-4444-4444-8444-444444444401';
const LESSON_ID = '99999999-9999-4999-8999-999999999901';
const PARENT_ID = '33333333-3333-4333-8333-333333333310';

const answer = (id, title, isCorrect = false) => ({ id, title, isCorrect });

const parentHtml =
  '<p><strong>A day in the life of Mai</strong></p>' +
  '<p>Mai is a student. She gets up at 6 o\'clock every morning. She goes to school by bus. ' +
  'In the afternoon, she does her homework and helps her mother. ' +
  'She usually watches TV at 8 p.m. and goes to bed at 10 p.m.</p>';

const children = [
  {
    id: '33333333-3333-4333-8333-333333333311',
    question: '<p>What time does Mai get up?</p>',
    index: 1,
    type: 'MULTIPLE_CHOICE',
    answers: [
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', '5 o\'clock'),
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02', '6 o\'clock', true),
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb03', '7 o\'clock'),
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb04', '8 o\'clock'),
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333312',
    question: '<p>How does Mai go to school?</p>',
    index: 2,
    type: 'MULTIPLE_CHOICE',
    answers: [
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb11', 'by bike'),
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb12', 'by bus', true),
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb13', 'on foot'),
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb14', 'by car'),
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333313',
    question: '<p>What does Mai usually do at 8 p.m.?</p>',
    index: 3,
    type: 'MULTIPLE_CHOICE',
    answers: [
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb21', 'does homework'),
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb22', 'helps her mother'),
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb23', 'watches TV', true),
      answer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb24', 'goes to bed'),
    ],
  },
];

const insertQuestion = async (connection, row) => {
  await connection.query(
    `INSERT INTO question (id, question, \`index\`, answers, note, type, questionGroup, \`group\`, parentId, sourceQuestionId, lesson, assignment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       question = VALUES(question),
       answers = VALUES(answers),
       parentId = VALUES(parentId),
       questionGroup = VALUES(questionGroup),
       \`group\` = VALUES(\`group\`)`,
    [
      row.id,
      row.question,
      row.index,
      row.answers ? JSON.stringify(row.answers) : null,
      row.note || '',
      row.type,
      row.group || null,
      row.group || null,
      row.parentId || null,
      row.sourceQuestionId || null,
      row.lesson || null,
      row.assignment || null,
    ],
  );
};

async function main() {
  const connection = await mysql.createConnection({
    host: env.MYSQL_HOST,
    port: Number(env.MYSQL_PORT),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASS,
    database: env.MYSQL_DATABASE,
  });

  await insertQuestion(connection, {
    id: PARENT_ID,
    question: parentHtml,
    index: 5,
    type: 'MULTIPLE_CHOICE',
    group: GROUP_GRAMMAR,
    note: 'Bài đọc có 3 câu hỏi con.',
  });

  for (const child of children) {
    await insertQuestion(connection, {
      ...child,
      group: GROUP_GRAMMAR,
      parentId: PARENT_ID,
    });
  }

  const lessonParentId = '55555555-5555-4555-8555-555555555521';
  await insertQuestion(connection, {
    id: lessonParentId,
    question: parentHtml,
    index: 4,
    type: 'MULTIPLE_CHOICE',
    note: 'Bài đọc có 3 câu hỏi con.',
    sourceQuestionId: PARENT_ID,
    lesson: LESSON_ID,
  });
  const lessonChildIds = [
    '55555555-5555-4555-8555-555555555522',
    '55555555-5555-4555-8555-555555555523',
    '55555555-5555-4555-8555-555555555524',
  ];
  for (const [index, child] of children.entries()) {
    await insertQuestion(connection, {
      ...child,
      id: lessonChildIds[index],
      group: null,
      parentId: lessonParentId,
      sourceQuestionId: child.id,
      lesson: LESSON_ID,
    });
  }

  const assignmentParentId = '55555555-5555-4555-8555-555555555531';
  await insertQuestion(connection, {
    id: assignmentParentId,
    question: parentHtml,
    index: 4,
    type: 'MULTIPLE_CHOICE',
    note: 'Bài đọc có 3 câu hỏi con.',
    sourceQuestionId: PARENT_ID,
    assignment: ASSIGNMENT_GRAMMAR,
  });
  const assignmentChildIds = [
    '55555555-5555-4555-8555-555555555532',
    '55555555-5555-4555-8555-555555555533',
    '55555555-5555-4555-8555-555555555534',
  ];
  for (const [index, child] of children.entries()) {
    await insertQuestion(connection, {
      ...child,
      id: assignmentChildIds[index],
      group: null,
      parentId: assignmentParentId,
      sourceQuestionId: child.id,
      assignment: ASSIGNMENT_GRAMMAR,
    });
  }

  const [rows] = await connection.query(
    `SELECT id, parentId, lesson IS NOT NULL AS onLesson, assignment IS NOT NULL AS onAssignment
     FROM question
     WHERE id = ? OR parentId IN (?, ?, ?)`,
    [PARENT_ID, PARENT_ID, lessonParentId, assignmentParentId],
  );
  console.log(`rows=${rows.length}`);
  await connection.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
