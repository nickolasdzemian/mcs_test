//-----------------------------------------------------------------------------------
//----------------------------------CRC-CALCULATING----------------------------------
//-----------------------------------------------------------------------------------

module.exports = function crc16(buf, len) {
    let crc = 0xffff;
    let i = 0;
    let j = 0;
    while (len--) {
        let b = buf[j++];
        crc ^= b << 8;
        crc = crc & 0xffff;

        for (i = 0; i < 8; i++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        crc = crc & 0xffff;
        }
    }
    return (crc = crc & 0xffff);
}
