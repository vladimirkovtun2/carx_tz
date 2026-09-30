// Типы для LESS-модулей (аналог встроенных типов Next.js для *.module.css)
declare module "*.module.less" {
    const classes: { readonly [key: string]: string };
    export default classes;
}
