const SafeAreaTopBar = () => (
  <div
    className="fixed top-0 inset-x-0 bg-black z-50 pointer-events-none"
    style={{ height: "env(safe-area-inset-top)" }}
    aria-hidden
  />
);

export default SafeAreaTopBar;
