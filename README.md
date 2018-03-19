# RankingService

Using vector-space-model and cosine similarity

## Getting Started

If you don't want to run this service on your machine, please just visit: http://34.205.33.211:3000/. We setup this server on an Amazon EC2 server already.

### Prerequisites

NodeJS 9.8.0
npm comes with NodeJS

You can download it from here:
https://nodejs.org/dist/v9.8.0/node-v9.8.0.pkg

### Installing

Extract files on your machine and enter to the root directory of it. Then type:

**npm install**

It should install all nodejs dependencies for this project.

It is using a remote MongoDB server on an Amazon EC2 server whose IP address is 34.205.33.211, port is 27017, no authorization is required.

### Run
At the root directory of the project, type:

**npm start**


it will take a few minutes to instantiate the data, then type:
http://localhost:3000
for accessing the service.
