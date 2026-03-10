import { authModule } from './auth/index.js';
import { userModule } from './user/index.js';
import { contentModule } from './content/index.js';
import { communityModule } from './community/index.js';
import { quizModule } from './quiz/index.js';
import { problemModule } from './problem/index.js';
import { codeModule } from './code/index.js';
import { fileModule } from './files/index.js';

export const domainModules = [
    authModule,
    userModule,
    contentModule,
    communityModule,
    quizModule,
    problemModule,
    codeModule,
    fileModule,
];

export const registerDomainModules = (app, prefix) => {
    for (const moduleDefinition of domainModules) {
        moduleDefinition.register(app, prefix);
    }
};
