# The study apparatus plus the 51 page snapshots it serves.
#
# Two processes run in this container: the study server on Cloud Run's $PORT,
# and the page server it spawns on loopback :3001. They are deliberately not
# split into two services - the study server reverse-proxies the pages so they
# land on its own origin, which is what lets the client script reach into the
# page to place the highlight.
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

# Assets first and in their own layer: ~800MB that changes far less often than
# the code, so a code-only rebuild reuses this layer instead of copying it again.
COPY assets ./assets
COPY vendor ./vendor

# No npm install: the study server and the page server both run on the Node
# standard library alone. server.js requires puppeteer inside a try/catch and
# simply disables its AX-tree routes when it is absent, which is what we want
# here - nothing in the study path uses them.
COPY package.json server.js ./
COPY eval ./eval

# The study server reads PORT and binds 0.0.0.0 when K_SERVICE is set, so no
# arguments are needed; everything else comes from the environment.
CMD ["node", "eval/human-study/server.js"]
