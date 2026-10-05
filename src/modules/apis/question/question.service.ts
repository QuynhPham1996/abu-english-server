import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ELessonType } from 'src/common/enums';
import { DtoCreateQuestionBody } from 'src/modules/apis/question/dto/create-question.dto';
import { QuestionRepository } from 'src/modules/repositories/question.repository';
import { DtoUpdateQuestionBody } from 'src/modules/apis/question/dto/update-question.dto';
import { AssignmentRepository } from 'src/modules/repositories/assignment.repository';
import { LessonRepository } from 'src/modules/repositories/lesson.repository';

@Injectable()
export class QuestionService {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly assignmentRepository: AssignmentRepository,
  ) {}

  private async nextIndex(ownerColumn: 'lesson' | 'assignment', ownerId: string) {
    const qb = await this.questionRepository
      .createQueryBuilder('question')
      .select('question.index')
      .where(`question.${ownerColumn} = :ownerId`, { ownerId })
      .andWhere('question.parentId IS NULL')
      .getRawMany();

    const indexes = qb.map((item) => item.question_index);
    return indexes.length > 0 ? Math.max(...indexes) + 1 : 1;
  }

  async createQuestion(body: DtoCreateQuestionBody) {
    if (!body.lesson && !body.assignment) {
      throw new BadRequestException('Câu hỏi phải thuộc một bài tập.');
    }

    let type = body.type;
    let assignmentId = body.assignment;
    const lessonId = body.lesson;

    if (lessonId) {
      const lesson = await this.lessonRepository.getLessonById(lessonId);
      if (!lesson) {
        throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
      }
      type = lesson.type;
      if (lesson.sourceAssignment) assignmentId = lesson.sourceAssignment;
    }

    if (assignmentId) {
      const assignment =
        await this.assignmentRepository.getAssignmentById(assignmentId);
      if (!assignment) {
        throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
      }
      type = assignment.type;
    }

    if (!type) {
      throw new BadRequestException('Bài tập chưa có loại câu hỏi.');
    }

    const isMultipleChoice = type === ELessonType.MULTIPLE_CHOICE;
    if (isMultipleChoice && (!body.answers || body.answers.length < 2)) {
      throw new BadRequestException(
        'Câu hỏi trắc nghiệm cần ít nhất 2 đáp án.',
      );
    }

    const ownerId = assignmentId || lessonId;
    if (!ownerId) {
      throw new BadRequestException('Câu hỏi phải thuộc một bài tập.');
    }

    const saved = await this.questionRepository.save({
      question: body.question,
      answers: isMultipleChoice ? body.answers : null,
      note: body.note,
      type,
      index: await this.nextIndex(
        assignmentId ? 'assignment' : 'lesson',
        ownerId,
      ),
      assignment: assignmentId || undefined,
      lesson: assignmentId ? undefined : lessonId,
    });

    if (lessonId && assignmentId) {
      await this.questionRepository.save({
        question: saved.question,
        answers: saved.answers,
        note: saved.note,
        type: saved.type,
        index: await this.nextIndex('lesson', lessonId),
        sourceQuestionId: saved.id,
        lesson: lessonId,
      });
    }
  }

  async updateQuestion(id: string, body: DtoUpdateQuestionBody) {
    const data = await this.questionRepository.getQuestionById(id);

    if (data) {
      const bodyParse = {
        question: body?.question,
        answers: body?.answers,
        note: body?.note,
      };

      await this.questionRepository.updateQuestionById(id, bodyParse);
    } else {
      throw new NotFoundException('Không tìm thấy câu hỏi trong hệ thống.');
    }
  }

  async deleteQuestions(ids: string[]) {
    if (ids.length > 0) {
      const idsArray = ids;

      await this.questionRepository
        .createQueryBuilder('question')
        .delete()
        .where('question.id IN (:...ids)', { ids: idsArray })
        .execute();
    }
  }
}
