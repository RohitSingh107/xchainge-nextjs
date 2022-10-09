import type { NextPage } from "next"
import { Form, Button, useNotification } from "web3uikit"
import { Upload } from "@web3uikit/core"

import { useWeb3Contract, useMoralis } from "react-moralis"
import xchaingeAbi from "../constants/Xchainge.json"
import xchaingeTokenAbi from "../constants/XchaingeToken.json"
import networkMapping from "../constants/networkMapping.json"
import { useEffect, useState } from "react"
import { BigNumber, ethers } from "ethers"

type NetworkConfigItem = {
    Xchainge: string[]
}

type NetworkConfigMap = {
    [chainId: string]: NetworkConfigItem
}

const SellNft: NextPage = () => {

    var fileUploaded = false
    var uploadedfile: Blob

    const { chainId, account, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    // Should point to correct address
    const xchaingeAddress = (networkMapping as NetworkConfigMap)[chainString].Xchainge[0]
    const [proceeds, setProceeds] = useState("0")

    const dispatch = useNotification()

    // @ts-ignore
    const { runContractFunction } = useWeb3Contract()

    const withDrawOptions = {
        abi: xchaingeAbi,
        contractAddress: xchaingeAddress,
        functionName: "withdrawProceeds",
        params: {},
    }

    async function setupUI() {
        const returnedProceeds = await runContractFunction({
            params: {
                abi: xchaingeAbi,
                contractAddress: xchaingeAddress,
                functionName: "getProceeds",
                params: {
                    seller: account,
                },
            },
            onSuccess: () => console.log("Setup Successfull!"),

            onError: (error) => console.log(error),
        })
        if (returnedProceeds) {
            setProceeds(returnedProceeds.toString())
        }
    }

    useEffect(() => {
        setupUI()
    }, [proceeds, account, isWeb3Enabled, chainId])

    const handleWithdrawSuccess = () => {
        dispatch({
            type: "success",
            message: "Proceeds withdrawn successfully",
            title: "Proceeds Withdrawn",
            position: "topR",
        })
    }

    async function handleApproveSuccess(
        nftAddress: string,
        tokenId: string,
        price: string
    ) {
        console.log("Ok... Now listing the item...")

        const options = {
            abi: xchaingeAbi,
            contractAddress: xchaingeAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price,
            },
        }

        await runContractFunction({
            params: options,
            onSuccess: () => handleListSuccess(),
            onError: (error) => console.log(error),
        })
    }

    async function handleListSuccess() {
        dispatch({
            type: "success",
            message: "NFT Listed successfully",
            title: "NFT Listed",
            position: "topR",
        })
    }

    async function approveAndList(nftAddress: string, tokenId: string, price: string) {


        console.log("Approving...")
        const options = {
            abi: xchaingeTokenAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: xchaingeAddress,
                tokenId: tokenId,
            },
        }

        await runContractFunction({
            params: options,
            onSuccess: () => handleApproveSuccess(nftAddress, tokenId, price),
            onError: (error) => {
                console.log(error)
            },
        })
    }

    async function mintAndList(data: any) {
        // const imgUrl = data.data[0].inputResult
        const tokenId = data.data[0].inputResult
        const productName = data.data[1].inputResult
        const description = data.data[2].inputResult
        const price = (data.data[3].inputResult).toString()

        // console.log("Approving...")
        // const options = {
        //     abi: xchaingeTokenAbi,
        //     contractAddress: data.data[0].inputResult,
        //     functionName: "approve",
        //     params: {
        //         to: xchaingeAddress,
        //         tokenId: data.data[1].inputResult,
        //     },
        // }

        // await runContractFunction({
        //     params: options,
        //     onSuccess: () => handleApproveSuccess(nftAddress, tokenId, price),
        //     onError: (error) => {
        //         console.log(error)
        //     },
        // })
    }

    function fileChange(file: Blob | null | undefined) {
        console.log("Uploading... Starts")
        fileUploaded = true
        uploadedfile = file!


    }

    return (
        <div>
            <Upload
                onChange={fileChange}
                theme="withIcon"
            />
            <Form
                onSubmit={mintAndList}
                buttonConfig={{
                    isLoading: false,
                    type: "submit",
                    theme: "primary",
                    text: "Sell NFT!",
                }}
                data={[

                    {
                        name: "Product Serial Number",
                        type: "number",
                        validation: {
                            required: true
                        },
                        value: "",
                        key: "tokenId",
                    },
                    {
                        name: "Name of the product",
                        type: "text",
                        validation: {
                            required: true
                        },
                        value: "",
                        key: "productName",
                    },
                    {
                        name: "Description of your product",
                        type: "textarea",
                        value: "",
                        key: "description",
                    },
                    {
                        name: "Price (in ETH)",
                        type: "number",
                        validation: {
                            required: true
                        },
                        value: "",
                        key: "price",
                    },
                ]}
                title="List your Asset as NFT!"
                id="Main Form"
            />
            <div className="py-4">
                <div className="flex flex-col gap-2 justify-items-start w-fit">
                    <h2 className="text-2xl">
                        Withdraw {ethers.utils.formatUnits(proceeds.toString(), "ether")}{" "}
                        proceeds
                    </h2>
                    {proceeds != "0" ? (
                        <Button
                            id="withdraw-proceeds"
                            onClick={() =>
                                runContractFunction({
                                    params: withDrawOptions,
                                    onSuccess: () => handleWithdrawSuccess,
                                    onError: (error) => console.log(error),
                                })
                            }
                            text="Withdraw"
                            theme="primary"
                            type="button"
                        />
                    ) : (
                        <p>No withdrawable proceeds detected</p>
                    )}
                </div>
            </div>
        </div>
    )
}
export default SellNft