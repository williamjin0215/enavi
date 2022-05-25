import {
  Page,
  Card,
  Stack,
  Pagination,
  TextField
} from "@shopify/polaris";
import useSWR, { mutate } from "swr";

import {restFetchWrapper} from "../../../../react-utils/request-handler";
import { useState, useEffect } from "react";
import ProductsTable from "./components/products-table";


const appBaseUrl = HOST;

var nestedProperty = require("nested-property");


function getProductQueryString(cursor, searchKeyword){
  return `${appBaseUrl}/get-products?${(cursor && `cursor=${cursor}&`) || ''}${(searchKeyword && `query=${searchKeyword}`) || ''}`;
}


function ProductsTableSection({restFetch, toggleMainLoader}) {

  const [pageCursor, setCurrentPageCursor] = useState(function () {
    return "";
  });


  const [pageInfo, setPageInfo] = useState(function () {
    return { hasNextPage: true, hasPreviousPage: false, nextCursor: "" };
  });
  const [prevCursors, setPrevPageCursor] = useState(function () {
    return [];
  });

  const [searchKeyword, setSearchKeyword] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const { data, error } = useSWR(
    getProductQueryString(pageCursor, searchTerm), restFetchWrapper(restFetch)
  );

  //Prefetch the next page.
  useSWR(getProductQueryString(pageInfo.nextCursor, searchTerm), restFetchWrapper(restFetch));


  useEffect(() => {
    toggleMainLoader(() => true);
  }, []);

  useEffect(() => {

    if (data) {
      setPageInfo((pageInfo) => {
        return {
          ...pageInfo,
          ...(nestedProperty.get(data,`products.0.pageInfo`) || {}),
          nextCursor:
          nestedProperty.get(data,`products.0.cursor`),
        };
      });
      toggleMainLoader(() => false);
    }else{
      console.log(error);
    }
  }, [data, error]);

  function handleNextPageClick() {
    setPrevPageCursor(function (prevCursors) {
      return [...prevCursors, pageCursor];
    });
    setCurrentPageCursor(function () {
      return pageInfo.nextCursor;
    });
  }

  function handleLastPageClick() {
    setPrevPageCursor(function () {
      return prevCursors.slice(0, -1);
    });
    setCurrentPageCursor(function () {
      return prevCursors[prevCursors.length - 1];
    });
  }

  async function clearFetchedData(){
    toggleMainLoader(() => true);
    setTimeout(() => toggleMainLoader(() => false), 2000);
    await mutate(getProductQueryString(pageCursor, searchTerm));
  }

  useEffect(() => {
    const searchDelay = setTimeout(() => {
      setCurrentPageCursor(() => "");
      setSearchTerm(searchKeyword);
    }, 1000);

    return () => clearTimeout(searchDelay);
  }, [searchKeyword]);


  return (
    <>
    <Page title="Products" fullWidth>
      {
      <>
        <Card>
            <>
              <Card.Section>
                <TextField
                  label="Search Products"
                  type="search"
                  placeholder="Search Products"
                  value={searchKeyword}
                  onChange={setSearchKeyword}
                  autoComplete="off"
                />
                <ProductsTable
                  data={data}
                  clearFetchedData={clearFetchedData}
                  restFetch={restFetch}
                />
              </Card.Section>
              <Stack distribution="center">
                <div className="p-8">
                  <Pagination
                    hasPrevious={pageInfo.hasPreviousPage}
                    onPrevious={handleLastPageClick}
                    hasNext={pageInfo.hasNextPage}
                    onNext={handleNextPageClick}
                  />
                </div>
              </Stack>
            </>
        </Card>
      </>
      }
    </Page>
  </>
  );
}

export default ProductsTableSection;
