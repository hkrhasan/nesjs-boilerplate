import { ForbiddenException } from '@nestjs/common';
import { CustomForbiddenException } from '../exceptions';

export const Pagination = (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
        if (args.length < 3) {
            throw new CustomForbiddenException('3 argument required');
        }

        const dto = args[0];
        const limit =
            dto.limit !== undefined
                ? parseInt(dto.limit) < 0
                    ? 0
                    : parseInt(dto.limit)
                : undefined;
        const page =
            dto.page !== undefined
                ? parseInt(dto.page) < 0
                    ? 0
                    : parseInt(dto.page)
                : undefined;
        const count = await this.prisma[args[1]].count({
            where: args[2]?.where,
        });
        const totalPages = Math.ceil(count / limit);

        if (page > totalPages) {
            throw new CustomForbiddenException('Invalid page!');
        }
        const response = {
            metadata: {
                page: page,
                limit: limit,
                totalPages: totalPages,
                count: count,
            },
        };

        const returnValue = await originalMethod.apply(this, [
            dto,
            limit,
            page,
            count,
            totalPages,
            {
                ...args[2],
                skip: page !== undefined ? page * limit : undefined,
                take: limit,
            },
        ]);

        response[args[1]] = returnValue;

        return response;
    };
    return descriptor;
};
