import { compare, hash } from "bcrypt";
import { sign, verify } from "jsonwebtoken";

const {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
} = process.env;

const SALT_ROUNDS = 10

export const hashPassword = async (plain: string): Promise<string> => {
    return await hash(plain, SALT_ROUNDS)
}

export const verifyPassword = async (plain: string, hash: string): Promise<boolean> => {
    return await compare(plain, hash)
}

export const signAccessToken = (payload: object): string => {
    return sign(payload, JWT_ACCESS_SECRET as string, {
        expiresIn: "15m"
    })
}

export const signRefreshToken = (payload: object): string => {
    return sign(payload, JWT_REFRESH_SECRET as string, {
        expiresIn: "30d"
    })
}

export const verifyAccessToken = (token: string): any => {
    return verify(token, JWT_ACCESS_SECRET as string)
}

export const verifyRefreshToken = (token: string): any => {
    return verify(token, JWT_REFRESH_SECRET as string)
}