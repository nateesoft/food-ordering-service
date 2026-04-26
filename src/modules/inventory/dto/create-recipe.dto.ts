import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class RecipeIngredientDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  ingredientId: number;

  @ApiProperty({ example: 200, description: 'Quantity used per 1 serving' })
  @IsNumber()
  quantityUsed: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  menuItemId: number;

  @ApiProperty({ type: [RecipeIngredientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients: RecipeIngredientDto[];
}
