process.env.NODE_ENV = "production";
const webpack = require("webpack");
const createConfig = require("../config/webpack.config");
const compiler = webpack(createConfig("production"));
compiler.run((error, stats) => {
  if (error) console.error(error);
  if (stats) console.log(stats.toString({ colors: process.stdout.isTTY, preset: "normal" }));
  // Closing the compiler flushes caches and releases build resources.
  compiler.close(closeError => {
    if (closeError) console.error(closeError);
    if (error || closeError || stats?.hasErrors()) process.exitCode = 1;
  });
});
