import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Receiver user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello! I have a question about the course.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class GetConversationDto {
  @ApiProperty({
    description: 'User ID to get conversation with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of messages per page',
    example: 20,
    required: false,
  })
  @IsOptional()
  limit?: number = 20;
}

export class MarkAsReadDto {
  @ApiProperty({
    description: 'Message ID to mark as read',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  messageId: string;
} 