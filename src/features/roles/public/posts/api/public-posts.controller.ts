import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { BlogsQueryRepository } from "../../../../infrstructura/blogs/blogs.query.repository";
import { BlogsQueryType } from "../../../sa/blogs/api/sa.blogs.models";
import { PaginationViewModel } from "../../../../../common/types";
import { PostViewModel } from "../../../../infrstructura/posts/posts.models";
import { PostsQueryRepository } from "../../../../infrstructura/posts/posts.query.repository";
import { AuthGuard } from "../../../../../guards/auth.guard";
import { CreateCommentInputModel } from "./input.models";
import { CommandBus } from "@nestjs/cqrs";
import { CreateCommentCommand } from "../../comments/application/use-cases/create-comment-use-case";
import { Request, Response } from "express";
import { CommentsQueryRepository } from "../../../../infrstructura/comments/comments.query.repository";

@Controller("posts")
export class PublicPosts {
  constructor(
    private postQuerysRepository: PostsQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
    private commandBus: CommandBus
  ) {}

  @Get("")
  @HttpCode(HttpStatus.OK)
  async getPosts(
    @Query() pageSize: BlogsQueryType
  ): Promise<PaginationViewModel<PostViewModel>> {
    return await this.postQuerysRepository.getPosts(pageSize);
  }

  @Get(":postId")
  @HttpCode(HttpStatus.OK)
  async getPostById(@Param() params: { postId: string }) {
    const post = await this.postQuerysRepository.getPostByPostId(params.postId);
    if (!post) {
      throw new NotFoundException("post by id not found");
    }
    return post;
  }

  // comments
  @Post(":postId/comments")
  @UseGuards(AuthGuard)
  @HttpCode(201)
  async createCommentForSelectedPost(
    @Req() request: Request,
    @Param() params: { postId: string },
    @Body() commentInputModel: CreateCommentInputModel // : Promise<CommentViewModel>
  ) {
    const result = await this.commandBus.execute(
      new CreateCommentCommand({
        userId: request.body.userId,
        userLogin: request.body.userLogin,
        postId: params.postId,
        content: commentInputModel.content,
      })
    );

    if (!result.isPostFound) {
      throw new NotFoundException("Post by this id not found");
    }

    if (result.isCommentCreated) {
      const commentViewModel = this.commentsQueryRepository.getCommentById(
        result.commentId
      );
      return commentViewModel;
    }

    return;
  }
}
