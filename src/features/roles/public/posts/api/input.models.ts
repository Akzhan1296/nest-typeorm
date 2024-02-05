import { IsIn, MaxLength, MinLength } from "class-validator";

export class CreateCommentInputModel {
  @MinLength(20)
  @MaxLength(300)
  public content: string;
}
const likes = ["None", "Like", "Dislike"] as const;
export type Likes = (typeof likes)[number];
export class PostLikeStatus {
  @IsIn(likes)
  likeStatus: Likes;
}