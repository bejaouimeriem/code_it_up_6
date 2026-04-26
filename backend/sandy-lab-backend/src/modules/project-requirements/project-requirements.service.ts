import { Injectable } from '@nestjs/common';
import { CreateProjectRequirementDto } from './dto/requirement.dto';
import { UpdateProjectRequirementDto } from './dto/update-project-requirement.dto';

@Injectable()
export class ProjectRequirementsService {
  create(createProjectRequirementDto: CreateProjectRequirementDto) {
    return 'This action adds a new projectRequirement';
  }

  findAll() {
    return `This action returns all projectRequirements`;
  }

  findOne(id: number) {
    return `This action returns a #${id} projectRequirement`;
  }

  update(id: number, updateProjectRequirementDto: UpdateProjectRequirementDto) {
    return `This action updates a #${id} projectRequirement`;
  }

  remove(id: number) {
    return `This action removes a #${id} projectRequirement`;
  }
}
