import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/context/shared/guards/jwt-auth.guard';
import { UpdateMyProfileDto } from '../dtos/update-user.dto';
import { UserPayload } from 'src/context/shared/decorators/user.decorator';
import { PayloadToken } from 'src/context/shared/models/token.model';
import { UserBaseService } from '../services/users.service';

@ApiTags('Profile')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class UserController {
  constructor(private readonly userService: UserBaseService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener profile por id' })
  findOne(@UserPayload() userRequest: PayloadToken) {
    return this.userService.findById(userRequest.sub);
  }
  /*
  @Patch()
  @ApiOperation({ summary: 'Update profile' })
  update(
    @UserPayload() userRequest: PayloadToken,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.userService.updateMyProfile(userRequest.sub, dto);
  }*/
}
