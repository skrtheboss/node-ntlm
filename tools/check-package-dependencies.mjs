import { FsTree, printChanges, flushChanges } from 'nx/src/generators/tree.js';
import { getProjects, readJson, writeJson, workspaceRoot } from '@nrwl/devkit';
import { output } from '@nrwl/workspace/src/utilities/output.js';
import path from 'path';
import semver from 'semver';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const PLACEHOLDER = '0.0.0-PLACEHOLDER';

function reportDiagnostics(diagnostics, name) {
    if (diagnostics.length > 0) {
        output.error({ title: `Irregularities detected in ${name}:`, bodyLines: diagnostics });
    }
}

function checkMainPackageDependencies({ tree, mainPackage, fix }) {
    const diagnostics = [];

    for (const [dependency, range] of Object.entries(mainPackage.dependencies || {})) {
        if (!semver.validRange(range)) {
            diagnostics.push(`Invalid semver-range for dependency '${dependency}' => '${range}'.`);
        } else {
            const minVersion = semver.minVersion(range).toString();

            if (minVersion !== range) {
                if (fix) {
                    mainPackage.dependencies[dependency] = minVersion;
                } else {
                    diagnostics.push(
                        `Invalid semver-range for dependency '${dependency}' => '${range}'. Should be '${minVersion}'.`
                    );
                }
            }
        }
    }

    reportDiagnostics(diagnostics, "main package.json's dependencies");

    if (fix) {
        writeJson(tree, 'package.json', mainPackage, { spaces: 4 });
    }

    return diagnostics;
}

function computeDependencyIrregularities({ dependencies, projects, mainPackage, fix, name }) {
    const diagnostics = [];

    for (const [dependency, range] of Object.entries(dependencies || {})) {
        if (projects.has(dependency)) {
            if (range !== PLACEHOLDER) {
                if (fix) {
                    dependencies[dependency] = PLACEHOLDER;
                } else {
                    diagnostics.push(
                        `Internal dependency '${dependency}' should be flagged with range '${PLACEHOLDER}'.`
                    );
                }
            }
        } else {
            if (!mainPackage.dependencies[dependency]) {
                diagnostics.push(`Dependency '${dependency}' is missing in package.json.`);
            } else if (semver.validRange(range) === null) {
                diagnostics.push(`Invalid semver-range for dependency '${dependency}' => '${range}'.`);
            } else {
                const minRange = semver.minVersion(range).toString();

                if (mainPackage.dependencies[dependency] !== minRange) {
                    const expectedRange = `^${mainPackage.dependencies[dependency]}`;

                    if (fix) {
                        dependencies[dependency] = expectedRange;
                    } else {
                        diagnostics.push(
                            `Invalid range for dependency '${dependency}' => '${range}'. Should be '${expectedRange}'.`
                        );
                    }
                }
            }
        }
    }

    reportDiagnostics(diagnostics, name);

    return diagnostics;
}

function checkProjectPackagesDependencies({ tree, projects, mainPackage, fix }) {
    const diagnostics = [];

    projects.forEach(({ packageJson, packageJsonPath }) => {
        diagnostics.push(
            ...computeDependencyIrregularities({
                dependencies: packageJson.dependencies,
                projects,
                mainPackage,
                fix,
                name: `'${packageJsonPath}' dependencies`,
            }),
            ...computeDependencyIrregularities({
                dependencies: packageJson.peerDependencies,
                projects,
                mainPackage,
                fix,
                name: `'${packageJsonPath}' peerDependencies`,
            })
        );

        if (fix) {
            writeJson(tree, packageJsonPath, packageJson, { spaces: 4 });
        }
    });

    return diagnostics;
}

function checkAndReportErrors({ fix, verbose, dryRun }) {
    const tree = new FsTree(workspaceRoot, verbose);

    const projects = new Map();

    getProjects(tree).forEach(config => {
        const packageJsonPath = path.join(config.root, 'package.json');

        if (tree.exists(packageJsonPath)) {
            const packageJson = readJson(tree, packageJsonPath);

            projects.set(packageJson.name, {
                packageJson,
                packageJsonPath,
                config,
            });
        }
    });

    const mainPackage = readJson(tree, 'package.json');

    const mainPackageErrors = checkMainPackageDependencies({ tree, mainPackage, fix });

    if (mainPackageErrors.length > 0) {
        process.exit(1);
    }

    const projectPackageErrors = checkProjectPackagesDependencies({ tree, projects, mainPackage, fix });

    if (projectPackageErrors.length > 0) {
        process.exit(1);
    }

    const changes = tree.listChanges();

    if (changes.length > 0) {
        if (dryRun) {
            output.note({ title: 'Applying fixes would apply changes to those files:' });
            printChanges(changes);
        } else {
            try {
                flushChanges(tree.root, changes);
                printChanges(changes);
                output.success({ title: 'Fixes have been applied!' });
            } catch (err) {
                output.success({ title: 'An error occurred while applying the fixes!', bodyLines: [err.message] });
            }
        }
    } else {
        output.success({ title: 'All dependencies are correct!' });
    }
}

const { fix, verbose, dryRun } = yargs(hideBin(process.argv))
    .command('$0')
    .option('fix', {
        type: 'boolean',
        description: 'Fix semver errors',
        default: false,
    })
    .option('dryRun', {
        type: 'boolean',
        description: 'Runs through and reports activity without writing to disk.',
        default: false,
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Run with verbose logging',
        default: false,
    })
    .parse();

checkAndReportErrors({ fix, verbose, dryRun });
