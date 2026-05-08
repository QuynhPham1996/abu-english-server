import { Injectable, NotFoundException } from '@nestjs/common';

import { DtoCreateQuestionBody } from 'src/modules/apis/question/dto/create-question.dto';
import { QuestionRepository } from 'src/modules/repositories/question.repository';
import { DtoUpdateQuestionBody } from 'src/modules/apis/question/dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(private readonly questionRepository: QuestionRepository) {}

  async createQuestion(body: DtoCreateQuestionBody) {
    const qb = await this.questionRepository
      .createQueryBuilder('question')
      .select('question.index')
      .where('question.lesson = :lesson', { lesson: body.lesson })
      .getRawMany();

    const questionIndexArr = qb.map((item) => item.question_index);

    const maxIndex =
      questionIndexArr.length > 0
        ? Math.max(...qb.map((item) => item.question_index))
        : 0;

    const bodyParse = {
      question: body?.question,
      answers: body?.answers,
      lesson: body?.lesson,
      note: body?.note,
      index: maxIndex + 1,
    };

    await this.questionRepository.save(bodyParse);
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
