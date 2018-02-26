FROM jasonking/sparkbot:latest

COPY pcap-skill.js /app/skills/

RUN cd /app \
  && npm install request-promise

WORKDIR /app

CMD ["node", "bot.js"]
