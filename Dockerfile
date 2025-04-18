FROM node:slim

RUN addgroup --system --gid 1001 github && \
    adduser --system --uid 1001 --gid 1001 github

WORKDIR /home/github/app

COPY package.json ./
COPY dist/ ./dist/
COPY action.yml ./

RUN chown -R github:github /home/github

USER github

ENTRYPOINT ["node", "--no-warnings=ExperimentalWarning", "/home/github/app/dist/index.js"]
