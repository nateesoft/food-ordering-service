import {
  IsArray,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SplitGroupDto {
  @ApiProperty({
    example: [1, 2],
    description: 'OrderItem IDs in this split group',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  itemIds: number[];
}

export class SplitOrderDto {
  @ApiProperty({ description: 'Groups of items for each split bill' })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => SplitGroupDto)
  groups: SplitGroupDto[];
}
