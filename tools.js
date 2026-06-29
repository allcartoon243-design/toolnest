// tools.js
export async function removeBackgroundWithImgly(file) {
    const { removeBackground } = await import("https://cdn.jsdelivr.net/npm/@imgly/background-removal@latest/dist/index.js");
    return await removeBackground(file, { publicPath: "/", model: "small" });
}
