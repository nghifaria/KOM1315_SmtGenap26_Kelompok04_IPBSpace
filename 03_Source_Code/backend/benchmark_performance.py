import time
import os
import sys
import secrets

# Ensure the backend directory is in the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.crypto import DocumentCrypto

def run_benchmark():
    print("=" * 60)
    print("STARTING SECURITY PERFORMANCE BENCHMARK (DocumentCrypto)")
    print("=" * 60)

    # Instantiate DocumentCrypto once to avoid repeating key generation overhead
    # (Since key generation is only done at startup/instantiation)
    print("Initializing DocumentCrypto service...")
    crypto = DocumentCrypto()
    print("Service initialized successfully.\n")

    # File sizes to test: 500 KB, 1 MB, 5 MB
    sizes = {
        "500 KB": 500 * 1024,
        "1 MB": 1024 * 1024,
        "5 MB": 5 * 1024 * 1024
    }
    iterations = 10

    results = {}

    for label, size_bytes in sizes.items():
        print(f"Benchmarking file size: {label} ({size_bytes} bytes) for {iterations} iterations...")
        
        # Generate dummy PDF plaintext content
        # Starting with PDF magic bytes for realism, filled with random bytes
        header = b"%PDF-1.4\n% \xee\xe2\xe1\xeb\n"
        padding_len = size_bytes - len(header)
        plaintext = header + secrets.token_bytes(padding_len)

        enc_times = []
        dec_times = []

        for i in range(iterations):
            # 1. Benchmark sign_and_encrypt
            start_enc = time.perf_counter()
            secured = crypto.sign_and_encrypt(plaintext, f"benchmark_{label.replace(' ', '_')}.pdf")
            end_enc = time.perf_counter()
            enc_times.append((end_enc - start_enc) * 1000.0) # convert to ms

            # 2. Benchmark verify_and_decrypt
            start_dec = time.perf_counter()
            result = crypto.verify_and_decrypt(secured)
            end_dec = time.perf_counter()
            dec_times.append((end_dec - start_dec) * 1000.0) # convert to ms

            # Verification assertions to ensure correctness
            assert result.signature_valid is True, f"Signature invalid on iteration {i}"
            assert result.plaintext == plaintext, f"Decrypted plaintext mismatch on iteration {i}"

        avg_enc = sum(enc_times) / len(enc_times)
        avg_dec = sum(dec_times) / len(dec_times)
        
        results[label] = {
            "avg_encrypt_ms": avg_enc,
            "avg_decrypt_ms": avg_dec
        }
        print(f"  -> Avg Encryption: {avg_enc:.2f} ms | Avg Decryption: {avg_dec:.2f} ms")

    # Display final results in a markdown table format
    print("\n" + "=" * 60)
    print("SUMMARY RESULTS (Average of 10 runs)")
    print("=" * 60)
    print(f"| {'Ukuran Berkas':<15} | {'Rata-rata Waktu Enkripsi (ms)':<32} | {'Rata-rata Waktu Dekripsi (ms)':<32} |")
    print(f"|{'-' * 17}|{'-' * 34}|{'-' * 34}|")
    for label, metrics in results.items():
        print(f"| {label:<15} | {metrics['avg_encrypt_ms']:<32.2f} | {metrics['avg_decrypt_ms']:<32.2f} |")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    run_benchmark()
