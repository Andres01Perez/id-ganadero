const VersionFooter = () => {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
  const commit = typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "local";

  return (
    <div className="w-full text-center pt-2 text-[10px] text-muted-foreground/60 select-none tracking-wider font-mono-num">
      v{version} · {commit}
    </div>
  );
};

export default VersionFooter;
