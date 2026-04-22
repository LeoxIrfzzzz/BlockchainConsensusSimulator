#ifndef SHA256_H
#define SHA256_H

#include <string>
#include <cstring>
#include <sstream>
#include <iomanip>

class SHA256 {
protected:
    typedef unsigned char uint8;
    typedef unsigned int uint32;
    typedef unsigned long long uint64;

    static const unsigned int SHA224_256_BLOCK_SIZE = (512/8);
public:
    void init() {
        m_h[0] = 0x6a09e667; m_h[1] = 0xbb67ae85; m_h[2] = 0x3c6ef372; m_h[3] = 0xa54ff53a;
        m_h[4] = 0x510e527f; m_h[5] = 0x9b05688c; m_h[6] = 0x1f83d9ab; m_h[7] = 0x5be0cd19;
        m_tot_len = 0; m_len = 0;
    }
    void update(const unsigned char *message, unsigned int len) {
        unsigned int block_nb;
        unsigned int new_len, rem_len, tmp_len;
        const unsigned char *shifted_message;
        tmp_len = SHA224_256_BLOCK_SIZE - m_len;
        rem_len = len < tmp_len ? len : tmp_len;
        memcpy(&m_block[m_len], message, rem_len);
        if (m_len + len < SHA224_256_BLOCK_SIZE) {
            m_len += len;
            return;
        }
        new_len = len - rem_len;
        block_nb = new_len / SHA224_256_BLOCK_SIZE;
        shifted_message = message + rem_len;
        transform(m_block, 1);
        transform(shifted_message, block_nb);
        rem_len = new_len % SHA224_256_BLOCK_SIZE;
        memcpy(m_block, &shifted_message[block_nb << 6], rem_len);
        m_len = rem_len;
        m_tot_len += (block_nb + 1) << 6;
    }
    void final(unsigned char *digest) {
        unsigned int block_nb;
        unsigned int pm_len;
        unsigned int len_b;
        int i;
        block_nb = (1 + ((SHA224_256_BLOCK_SIZE - 9) < (m_len % SHA224_256_BLOCK_SIZE)));
        len_b = (m_tot_len + m_len) << 3;
        pm_len = block_nb << 6;
        memset(m_block + m_len, 0, pm_len - m_len);
        m_block[m_len] = 0x80;
        for (i = 0; i < 4; i++) {
            m_block[pm_len - 1 - i] = (unsigned char)((len_b >> (i * 8)) & 0x000000ff);
        }
        transform(m_block, block_nb);
        for (i = 0; i < 8; i++) {
            for (int j = 0; j < 4; j++) {
                digest[i * 4 + j] = (unsigned char)((m_h[i] >> (24 - j * 8)) & 0x000000ff);
            }
        }
    }
    static const unsigned int DIGEST_SIZE = (256 / 8);

protected:
    void transform(const unsigned char *message, unsigned int block_nb) {
        static const uint32 sha256_k[64] = {
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        };
        uint32 w[64];
        uint32 wv[8];
        uint32 t1, t2;
        const unsigned char *sub_block;
        int i;
        for (i = 0; i < (int) block_nb; i++) {
            sub_block = message + (i << 6);
            for (int j = 0; j < 16; j++) {
                w[j] = ((uint32)sub_block[j * 4 + 0] << 24) |
                       ((uint32)sub_block[j * 4 + 1] << 16) |
                       ((uint32)sub_block[j * 4 + 2] << 8) |
                       ((uint32)sub_block[j * 4 + 3]);
            }
            for (int j = 16; j < 64; j++) {
                w[j] = ( (((w[j - 2] >> 17) | (w[j - 2] << (32 - 17))) ^ ((w[j - 2] >> 19) | (w[j - 2] << (32 - 19))) ^ (w[j - 2] >> 10)) ) + w[j - 7] + ( (((w[j - 15] >> 7) | (w[j - 15] << (32 - 7))) ^ ((w[j - 15] >> 18) | (w[j - 15] << (32 - 18))) ^ (w[j - 15] >> 3)) ) + w[j - 16];
            }
            for (int j = 0; j < 8; j++) wv[j] = m_h[j];
            for (int j = 0; j < 64; j++) {
                t1 = wv[7] + ( (((wv[4] >> 6) | (wv[4] << (32 - 6))) ^ ((wv[4] >> 11) | (wv[4] << (32 - 11))) ^ ((wv[4] >> 25) | (wv[4] << (32 - 25)))) ) + ((wv[4] & wv[5]) ^ (~wv[4] & wv[6])) + sha256_k[j] + w[j];
                t2 = ( (((wv[0] >> 2) | (wv[0] << (32 - 2))) ^ ((wv[0] >> 13) | (wv[0] << (32 - 13))) ^ ((wv[0] >> 22) | (wv[0] << (32 - 22)))) ) + ((wv[0] & wv[1]) ^ (wv[0] & wv[2]) ^ (wv[1] & wv[2]));
                wv[7] = wv[6];
                wv[6] = wv[5];
                wv[5] = wv[4];
                wv[4] = wv[3] + t1;
                wv[3] = wv[2];
                wv[2] = wv[1];
                wv[1] = wv[0];
                wv[0] = t1 + t2;
            }
            for (int j = 0; j < 8; j++) m_h[j] += wv[j];
        }
    }
    unsigned int m_tot_len;
    unsigned int m_len;
    unsigned char m_block[2 * SHA224_256_BLOCK_SIZE];
    uint32 m_h[8];
};

inline std::string sha256(const std::string& input) {
    unsigned char digest[SHA256::DIGEST_SIZE];
    memset(digest, 0, SHA256::DIGEST_SIZE);
    
    SHA256 ctx;
    ctx.init();
    ctx.update((const unsigned char*)input.c_str(), input.length());
    ctx.final(digest);

    std::stringstream ss;
    for (int i = 0; i < SHA256::DIGEST_SIZE; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)digest[i];
    }
    return ss.str();
}

#endif // SHA256_H
