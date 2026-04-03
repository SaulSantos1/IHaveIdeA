import { IsString, IsNotEmpty, Length, IsUUID } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  sessionHash: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  answer: string;
}
