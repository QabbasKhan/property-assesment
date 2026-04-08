import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ITransaction, Transaction } from './entities/transaction.entity';
import { Model } from 'mongoose';
import { Pagination } from 'src/common/utils/types.util';
import { IUser } from '../users/entities/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly Transaction: Model<ITransaction>,
  ) {}
  async create(createTransactionDto: CreateTransactionDto) {
    createTransactionDto.transactionId = `TXN-${Date.now()}`;
    const createdTransaction =
      await this.Transaction.create(createTransactionDto);
    return createdTransaction;
  }

  async adminFindAll(pagination: Pagination, query: { search: string }) {
    const dbQuery = {
      ...(query.search && {
        transactionId: { $regex: query.search, $options: 'i' },
        'user.name': { $regex: query.search, $options: 'i' },
        'user.email': { $regex: query.search, $options: 'i' },
      }),
    };

    const [data] = await this.Transaction.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                _id: 1,
                photo: 1,
                status: 1,
                subscription: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$user' },
      { $match: dbQuery },

      {
        $facet: {
          transactions: [
            { $sort: { createdAt: -1 } },
            { $skip: pagination?.skip || 0 },
            { $limit: pagination?.limit || 10 },
            {
              $lookup: {
                from: 'subscriptionpackages',
                localField: 'package',
                foreignField: '_id',
                as: 'package',
              },
            },
            { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);
    return {
      data: data.transactions || [],
      totalCount: data.totalCount[0]?.count || 0,
    };
  }

  async findMy(user: IUser, pagination: Pagination, query: { search: string }) {
    const dbQuery = {
      'user._id': user._id,
      ...(query.search && {
        $or: [
          { transactionId: { $regex: query.search, $options: 'i' } },
          { 'user.name': { $regex: query.search, $options: 'i' } },
          { 'user.email': { $regex: query.search, $options: 'i' } },
        ],
      }),
    };

    const [data] = await this.Transaction.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: dbQuery },
      {
        $facet: {
          transactions: [
            { $sort: { createdAt: -1 } },
            { $skip: pagination?.skip || 0 },
            { $limit: pagination?.limit || 10 },
            {
              $lookup: {
                from: 'subscriptionpackages',
                localField: 'package',
                foreignField: '_id',
                as: 'package',
              },
            },
            { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);
    return {
      data: data.transactions || [],
      totalCount: data.totalCount[0]?.count || 0,
    };
  }
}
