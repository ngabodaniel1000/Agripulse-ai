const React = require("react");

const stub = (name) => {
  const Component = ({ children }) => React.createElement("div", { "data-chart": name }, children);
  Component.displayName = name;
  return Component;
};

module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => stub(String(prop)),
  },
);
