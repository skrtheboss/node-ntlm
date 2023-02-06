import { FsTree } from 'nx/src/generators/tree.js';
import { getProjects, readJson, workspaceRoot } from '@nrwl/devkit';
import path from 'node:path';
import fs from 'node:fs';

const PLACEHOLDER = '0.0.0-PLACEHOLDER';

function checkAndReportErrors() {
    const tree = new FsTree(workspaceRoot, false);

    const { version } = readJson(tree, 'lerna.json');

    getProjects(tree).forEach(config => {
        const packageJsonPath = path.join(workspaceRoot, config.targets.build.options.outputPath, 'package.json');

        fs.writeFileSync(
            packageJsonPath,
            fs.readFileSync(packageJsonPath, { encoding: 'utf8' }).replaceAll(PLACEHOLDER, version),
            { encoding: 'utf8' }
        );
    });
}

checkAndReportErrors();
