//-----------------------------------------------------------------------------------
//-------------------------------DECODE-BINARY-BUFFER--------------------------------
//-----------------------------------------------------------------------------------

module.exports = decode = {
    base64: {
        decode: (str) =>
        new DataView(
            Uint8Array.from(
            typeof globalThis.Buffer === "function"
                ? [...Buffer.from(str, "base64")]
                : [...atob(str)].map((x) => x.charCodeAt(0))
            ).buffer
        ),
    },
};
