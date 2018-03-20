node {
    def app

	stage('Clone repository') {
		checkout scm
	}

	stage('Build image') {
		app = docker.build("jasonking/pcap-sparkbot")
	}

	stage('Test image') {
		app.inside {
			sh 'node --version'
		}
	}

	stage('Push image') {
		docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
			app.push("${env.BUILD_NUMBER}")
			app.push("latest")
		}
	}
}