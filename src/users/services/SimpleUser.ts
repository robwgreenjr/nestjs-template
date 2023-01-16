import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { IUserManager } from "./IUserManager";
import { USER_REPOSITORY } from "../repositories/UsersRepository";
import { IUsersRepository } from "../repositories/IUsersRepository";
import { UserModel } from "../models/UserModel";
import { User } from "../entities/User";
import {
    USER_CREATED_EVENT,
    USER_DELETED_EVENT,
    USER_UPDATED_EVENT,
} from "../events/UserEvents";
import { QueryModel } from "../../global/models/QueryModel";
import { QueryResponse } from "../../global/models/QueryResponse";
import { UserMapper } from "../mappers/UserMapper";

export const SIMPLE_USER = "SIMPLE_USER";

@Injectable()
export class SimpleUser implements IUserManager {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUsersRepository,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    async create(userModel: UserModel): Promise<UserModel> {
        let user = UserMapper.toEntity(userModel);

        user = await this.userRepository.create(user);

        userModel = UserMapper.entityToModel(user);

        this.eventEmitter.emit(USER_CREATED_EVENT, userModel);

        return userModel;
    }

    async createAll(userModelList: UserModel[]): Promise<UserModel[]> {
        let userList = userModelList.map((userModel) =>
            UserMapper.toEntity(userModel),
        );

        userList = await this.userRepository.createAll(userList);

        userModelList = userList.map((user) => UserMapper.entityToModel(user));
        for (const userModel of userModelList) {
            this.eventEmitter.emit(USER_CREATED_EVENT, userModel);
        }

        return userModelList;
    }

    async delete(id: number): Promise<void> {
        const user: User | null = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundException(`User with id (${id}) wasn't found.`);
        }

        await this.userRepository.delete(user);

        this.eventEmitter.emit(
            USER_DELETED_EVENT,
            UserMapper.entityToModel(user),
        );
    }

    async find(queryModel: QueryModel): Promise<QueryResponse> {
        const user: User | null = await this.userRepository.find(queryModel);

        if (!user) {
            throw new NotFoundException("User not found.");
        }

        const queryResponse = new QueryResponse();
        queryResponse.data = [UserMapper.entityToModel(user)];
        queryResponse.setCount(1);
        queryResponse.setPageCount(1);

        return queryResponse;
    }

    async findAll(queryModel: QueryModel): Promise<QueryResponse> {
        const userList = await this.userRepository.findAll(queryModel);

        const queryResponse = new QueryResponse();
        queryResponse.data = userList.map((user) =>
            UserMapper.entityToModel(user),
        );
        queryResponse.setCount(await this.userRepository.count(queryModel));
        queryResponse.setOffset(queryModel.offset ?? 0);
        queryResponse.setLimit(queryModel.limit ?? 200);
        queryResponse.setPageCount(queryResponse.data.length);

        return queryResponse;
    }

    async findByEmail(email: string): Promise<UserModel> {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new NotFoundException(
                `User with email (${email}) wasn't found.`,
            );
        }

        return UserMapper.entityToModel(user);
    }

    async findById(id: number): Promise<UserModel> {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundException(`User with id (${id}) wasn't found.`);
        }

        return UserMapper.entityToModel(user);
    }

    async update(id: number, userModel: UserModel): Promise<UserModel> {
        let user = UserMapper.toEntity(userModel);
        user.id = id;

        user = await this.userRepository.update(user);

        userModel = UserMapper.entityToModel(user);

        this.eventEmitter.emit(USER_UPDATED_EVENT, userModel);

        return userModel;
    }

    async updateAll(userModelList: UserModel[]): Promise<UserModel[]> {
        let userList = userModelList.map((userModel) =>
            UserMapper.toEntity(userModel),
        );

        userList = await this.userRepository.updateAll(userList);

        userModelList = userList.map((user) => UserMapper.entityToModel(user));
        for (const userModel of userModelList) {
            this.eventEmitter.emit(USER_UPDATED_EVENT, userModel);
        }

        return userModelList;
    }
}
