#!groovy
@Library('waluigi@v4.5.0') _

beehiveFlowBuild(
  publish: {
    def status = beehiveFlowStatus();
    if (status.branchState == 'releaseReady') {
      archiveArtifacts artifacts: 'dist/**'
    }

    sh "yarn beehive-flow publish --dist-dir dist/antora-extension-livedemos"
  }
)
