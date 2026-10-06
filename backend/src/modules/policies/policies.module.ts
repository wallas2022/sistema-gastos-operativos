import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PolicyEngineService } from './engine/policy-engine.service';
import { StandardPolicyConditionEvaluator } from './engine/standard-policy-condition.evaluator';
import { POLICY_CONDITION_EVALUATORS } from './engine/policy-condition-evaluator.interface';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';

@Module({
  imports: [PrismaModule],
  controllers: [PoliciesController],
  providers: [
    PoliciesService,
    PolicyEngineService,
    StandardPolicyConditionEvaluator,
    {
      provide: POLICY_CONDITION_EVALUATORS,
      inject: [StandardPolicyConditionEvaluator],
      useFactory: (standardEvaluator: StandardPolicyConditionEvaluator) => [
        standardEvaluator,
      ],
    },
  ],
  exports: [PolicyEngineService],
})
export class PoliciesModule {}
