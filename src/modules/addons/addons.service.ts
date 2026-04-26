import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddOnDto, CreateAddOnGroupDto } from './dto';

@Injectable()
export class AddonsService {
  constructor(private prisma: PrismaService) {}

  // Add-ons
  async findAllAddOns(category?: string, isActive?: boolean, branchId?: number) {
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.addOn.findMany({
      where,
      orderBy: { id: 'asc' },
    });
  }

  async findOneAddOn(id: number) {
    const addOn = await this.prisma.addOn.findUnique({
      where: { id },
    });

    if (!addOn) {
      throw new NotFoundException(`Add-on with ID ${id} not found`);
    }

    return addOn;
  }

  async createAddOn(createAddOnDto: CreateAddOnDto, branchId?: number) {
    return this.prisma.addOn.create({
      data: { ...createAddOnDto, branchId },
    });
  }

  async updateAddOn(id: number, updateAddOnDto: Partial<CreateAddOnDto>) {
    await this.findOneAddOn(id);

    return this.prisma.addOn.update({
      where: { id },
      data: updateAddOnDto,
    });
  }

  async removeAddOn(id: number) {
    await this.findOneAddOn(id);

    return this.prisma.addOn.delete({
      where: { id },
    });
  }

  // Add-on Groups
  async findAllAddOnGroups(category?: string, isActive?: boolean, branchId?: number) {
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.addOnGroup.findMany({
      where,
      include: {
        items: {
          include: {
            addOn: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOneAddOnGroup(id: number) {
    const addOnGroup = await this.prisma.addOnGroup.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            addOn: true,
          },
        },
      },
    });

    if (!addOnGroup) {
      throw new NotFoundException(`Add-on group with ID ${id} not found`);
    }

    return addOnGroup;
  }

  async createAddOnGroup(createAddOnGroupDto: CreateAddOnGroupDto, branchId?: number) {
    const { addOnIds, ...data } = createAddOnGroupDto;

    return this.prisma.addOnGroup.create({
      data: {
        ...data,
        branchId,
        items: addOnIds
          ? {
              create: addOnIds.map((addOnId) => ({
                addOnId,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          include: {
            addOn: true,
          },
        },
      },
    });
  }

  async updateAddOnGroup(
    id: number,
    updateAddOnGroupDto: Partial<CreateAddOnGroupDto>,
  ) {
    await this.findOneAddOnGroup(id);

    const { addOnIds, ...data } = updateAddOnGroupDto;

    if (addOnIds !== undefined) {
      await this.prisma.addOnGroupItem.deleteMany({
        where: { addOnGroupId: id },
      });
    }

    return this.prisma.addOnGroup.update({
      where: { id },
      data: {
        ...data,
        items:
          addOnIds !== undefined
            ? {
                create: addOnIds.map((addOnId) => ({
                  addOnId,
                })),
              }
            : undefined,
      },
      include: {
        items: {
          include: {
            addOn: true,
          },
        },
      },
    });
  }

  async removeAddOnGroup(id: number) {
    await this.findOneAddOnGroup(id);

    return this.prisma.addOnGroup.delete({
      where: { id },
    });
  }

  async getAddOnCategories(branchId?: number) {
    const where: any = { isActive: true };
    if (branchId) where.branchId = branchId;

    const items = await this.prisma.addOn.findMany({
      where,
      select: { category: true },
      distinct: ['category'],
    });

    return items.map((item) => item.category);
  }
}
