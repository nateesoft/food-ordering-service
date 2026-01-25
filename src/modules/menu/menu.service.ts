import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string, isActive?: boolean) {
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.menuItem.findMany({
      where,
      include: {
        setComponents: true,
        availableAddOns: {
          include: {
            addOn: true,
          },
        },
        availableAddOnGroups: {
          include: {
            addOnGroup: {
              include: {
                items: {
                  include: {
                    addOn: true,
                  },
                },
              },
            },
          },
        },
        nestedMenuConfig: {
          include: {
            rootOptions: {
              include: {
                nestedMenuOption: {
                  include: {
                    children: {
                      include: {
                        children: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        setComponents: true,
        availableAddOns: {
          include: {
            addOn: true,
          },
        },
        availableAddOnGroups: {
          include: {
            addOnGroup: {
              include: {
                items: {
                  include: {
                    addOn: true,
                  },
                },
              },
            },
          },
        },
        nestedMenuConfig: {
          include: {
            rootOptions: {
              include: {
                nestedMenuOption: {
                  include: {
                    children: {
                      include: {
                        children: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    return menuItem;
  }

  async create(createMenuItemDto: CreateMenuItemDto) {
    const { setComponents, addOnIds, addOnGroupIds, ...data } =
      createMenuItemDto;

    return this.prisma.menuItem.create({
      data: {
        ...data,
        setComponents: setComponents
          ? {
              create: setComponents,
            }
          : undefined,
        availableAddOns: addOnIds
          ? {
              create: addOnIds.map((addOnId) => ({
                addOnId,
              })),
            }
          : undefined,
        availableAddOnGroups: addOnGroupIds
          ? {
              create: addOnGroupIds.map((addOnGroupId) => ({
                addOnGroupId,
              })),
            }
          : undefined,
      },
      include: {
        setComponents: true,
        availableAddOns: {
          include: {
            addOn: true,
          },
        },
        availableAddOnGroups: {
          include: {
            addOnGroup: true,
          },
        },
      },
    });
  }

  async update(id: number, updateMenuItemDto: UpdateMenuItemDto) {
    await this.findOne(id);

    const { setComponents, addOnIds, addOnGroupIds, ...data } =
      updateMenuItemDto;

    // Delete existing relations if new ones are provided
    if (setComponents !== undefined) {
      await this.prisma.setComponent.deleteMany({
        where: { menuItemId: id },
      });
    }

    if (addOnIds !== undefined) {
      await this.prisma.menuItemAddOn.deleteMany({
        where: { menuItemId: id },
      });
    }

    if (addOnGroupIds !== undefined) {
      await this.prisma.menuItemAddOnGroup.deleteMany({
        where: { menuItemId: id },
      });
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        ...data,
        setComponents:
          setComponents !== undefined
            ? {
                create: setComponents,
              }
            : undefined,
        availableAddOns:
          addOnIds !== undefined
            ? {
                create: addOnIds.map((addOnId) => ({
                  addOnId,
                })),
              }
            : undefined,
        availableAddOnGroups:
          addOnGroupIds !== undefined
            ? {
                create: addOnGroupIds.map((addOnGroupId) => ({
                  addOnGroupId,
                })),
              }
            : undefined,
      },
      include: {
        setComponents: true,
        availableAddOns: {
          include: {
            addOn: true,
          },
        },
        availableAddOnGroups: {
          include: {
            addOnGroup: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.menuItem.delete({
      where: { id },
    });
  }

  async getCategories() {
    const items = await this.prisma.menuItem.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return items.map((item) => item.category);
  }
}
