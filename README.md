# pcap-sparkbot
A Cisco Spark bot based on the botkit framework.  The bot is intended as a technology demonstration of using a bot to launch packet capture jobs on one or more Cisco IOS-XE based devices enabled with the packet capture API found here:

https://github.com/chrishocker/xepacketcap

In order for it to function, the xepacketcap API must be running on the target IOS XE device.

The bot consists of javascript file implementing the packet capture skill, a Dockerfile with instructions for building the container as well as as a docker-compose.yml file for bringing up the container and injecting the required environment variables.
# Configuration
In order for the bot to function, it needs certain configuration parameters specified at runtime.  For the botkit framework, this is usually done with environment variables in a .env file.  Because this project uses Docker containers, we use Docker Compose to inject environment variables into the container at runtime.

The docker-compose.yml file will look for an environemnt configuration file named botkit-vars.env and this file needs to have certain variables set.  The following variables are required in the botkit-vars.env file:

	# Environment Config

	# store your secrets and config variables in here
	# only invited collaborators will be able to see your .env values
	# reference these in your code with process.env.SECRET
	access_token=<your Spark bot access token>
	public_address=<webhook URL>
	secret=<user-specified secret>
	PORT=<port bot will listen on, usually 8080>
	
	# note: .env is a shell file so there can't be spaces around =
# Running the container
After you have supplied the required environment variables in the botkit-vars.env file.  The easiest way to run the container is with Docker Compose.  From within the pcap-sparkbot directory:

`docker-compose up`



