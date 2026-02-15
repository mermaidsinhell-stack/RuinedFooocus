# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [

    pkgs.nodejs_20
  ];

  # Sets environment variables in the workspace
  env = {
    TMPDIR = "/home/user/.tmp";
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];

    # Enable previews
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npx" "vite" "--host" "0.0.0.0" "--port" "$PORT"];
          cwd = "frontend";
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        npm-install = "cd frontend && npm install";
      };
      # Runs when the workspace is (re)started
      onStart = {
        # Ensure TMPDIR directory exists for Claude CLI plugin installs
        ensure-tmpdir = "mkdir -p /home/user/.tmp";
      };
    };
  };
}
