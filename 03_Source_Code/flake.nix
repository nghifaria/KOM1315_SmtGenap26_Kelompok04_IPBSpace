{
  description = "Fullstack IPB Space Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};

        # --- Versi Bahasa Pemrograman ---
        python = pkgs.python314;
        nodejs = pkgs.nodejs_22; # Node.js versi LTS terbaru untuk Frontend

        # =========================================================
        # Custom Commands (Dialihkan ke masing-masing folder)
        # =========================================================

        dev-db = pkgs.writeShellScriptBin "dev-db" ''
          cd backend || exit 1
          docker compose up db -d
        '';

        dev-db-down = pkgs.writeShellScriptBin "dev-db-down" ''
          cd backend || exit 1
          docker compose down
        '';

        dev-run = pkgs.writeShellScriptBin "dev-run" ''
          cd backend || exit 1
          alembic upgrade head
          uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
        '';

        dev-fe = pkgs.writeShellScriptBin "dev-fe" ''
          cd frontend || exit 1
          npm run dev
        '';

        # =========================================================
        # Pengelompokan Packages
        # =========================================================

        backendPkgs = with pkgs; [
          python
          python3Packages.pip
          python3Packages.virtualenv
          gcc
          libffi
          openssl
          postgresql
          docker
          docker-compose
          stdenv.cc.cc.lib # Pustaka C++ untuk greenlet

          # Command Backend
          dev-db
          dev-db-down
          dev-run
        ];

        frontendPkgs = with pkgs; [
          nodejs

          # Command Frontend
          dev-fe
        ];

        # =========================================================
        # Shell Hooks (Skrip saat shell dijalankan)
        # =========================================================

        backendHook = ''
          export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib}/lib:$LD_LIBRARY_PATH"
          export VENV_DIR="./backend/.venv"

          # Pastikan folder backend ada sebelum mencoba membuat venv
          if [ -d "./backend" ]; then
            if [ ! -d "$VENV_DIR" ]; then
              echo "Membuat virtual environment baru di $VENV_DIR..."
              ${python}/bin/python -m venv $VENV_DIR
            fi

            source $VENV_DIR/bin/activate
            pip install --upgrade pip setuptools wheel --quiet

            if [ -f ./backend/requirements.txt ]; then
              pip install -r ./backend/requirements.txt --quiet
            fi
          else
            echo "⚠️  Folder './backend' tidak ditemukan. Pastikan Anda berada di root directory."
          fi
        '';

        frontendHook = ''
          # Tambahkan variabel lingkungan frontend tambahan di sini jika diperlukan
          # export VITE_APP_ENV="development"
          if [ -d "./frontend" ]; then
            # Jika folder node_modules belum ada, otomatis jalankan npm install
            if [ ! -d "./frontend/node_modules" ]; then
              echo "📦 Menginstal dependensi frontend (Vite, dll) pertama kali..."

              # Gunakan --prefix agar npm mengeksekusi install di dalam folder frontend
              # tanpa perlu mengubah posisi direktori terminal Anda
              npm install --prefix ./frontend --quiet
            fi
          else
            echo "⚠️  Folder './frontend' tidak ditemukan. Pastikan Anda berada di root directory."
          fi
        '';
      in {
        # =========================================================
        # Definisi devShells
        # =========================================================
        devShells = {
          # 1. nix develop .#backend
          backend = pkgs.mkShell {
            buildInputs = backendPkgs;
            shellHook = ''
              ${backendHook}
              echo ""
              echo "🐍 Lingkungan Backend (Python) Siap!"
              echo "Gunakan: dev-db, dev-db-down, dev-run"
            '';
          };

          # 2. nix develop .#frontend
          frontend = pkgs.mkShell {
            buildInputs = frontendPkgs;
            shellHook = ''
              ${frontendHook}
              echo ""
              echo "⚡ Lingkungan Frontend (Node.js/Vite) Siap!"
              echo "Gunakan: dev-fe"
            '';
          };

          # 3. nix develop (Default - Menjalankan Fullstack)
          default = pkgs.mkShell {
            # Menggabungkan semua package
            buildInputs = backendPkgs ++ frontendPkgs;
            shellHook = ''
              ${backendHook}
              ${frontendHook}
              echo ""
              echo "🚀 Lingkungan Fullstack (Backend + Frontend) Siap!"
              echo "--------------------------------------------------------"
              echo "Command berikut sudah ditambahkan ke PATH Anda:"
              echo "  🔹 dev-db      : Menyalakan PostgreSQL via Docker"
              echo "  🔹 dev-db-down : Mematikan PostgreSQL Docker"
              echo "  🔹 dev-run     : Menjalankan Backend (Auto-Reload)"
              echo "  🔹 dev-fe      : Menjalankan Frontend (Vite)"
              echo "--------------------------------------------------------"
            '';
          };
        };
      }
    );
}
