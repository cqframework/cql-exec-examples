# CQL Execution Examples

This repository is intended to include examples showing how to use the
[cql-execution](https://github.com/cqframework/cql-execution)
library.  Currently, there is a single example, demonstrating how to use `cql-execution` with the
[cql-exec-fhir](https://github.com/cqframework/cql-exec-fhir) data source and
[cql-exec-vsac](https://github.com/cqframework/cql-exec-vsac) code service.

The `cql-exec-vsac` code service requires a valid UMLS account to download value sets.  If you do not have an UMLS
account, you can request one here: https://uts.nlm.nih.gov/license.html

NOTE: These are simplified examples, designed only for the purpose of demonstrating how to use the cql-execution and
its corresponding modules.  These examples are NOT clinically validated and should NOT be used in a clinical setting.

# Setting Up the Environment

To use this project, you should perform the following steps:

1. Install [Node.js](https://nodejs.org/en/download/)
2. Install [Yarn](https://yarnpkg.com/en/docs/install)
3. Execute the following from this project's root directory: `yarn`

# Running the Example

The first time you run the example, you need to download the referenced value sets from the Value Set Authority Center
(VSAC).  This requires your username and password:

```bash
$ node index.js myUmlsUserName myUmlsPassword
```

NOTE: You can also set the credentials by setting `UMLS_USER_NAME` and `UMLS_PASSWORD` environment variables, instead
of passing the credentials on the command line.

After running once with your credentials, the downloaded value set definitions are cached.  After that, you should be
able to run without credentials:

```bash
$ node index.js
```

# Linting the Code

To encourage quality and consistency within the code base, all code should pass eslint without any warnings.  Many text editors can be configured to automatically flag eslint violations.  We also provide an npm script for running eslint on the project.  To run eslint, execute the following command:

```
$ yarn lint
```