"use client";

import type { ValidateErrorEntity } from "rc-field-form/lib/interface";
import { useState } from "react";
import { Button, Form, Input, Layout, message, Select } from "antd";

const { Content, Header } = Layout;
const { Option } = Select;

type Values = {
  accessToken: string;
  fileKey: string;
  nodeIds?: string;
};

const accessToken = process.env.NEXT_PUBLIC_ACCESSTOKEN;

const fileConfig1 = {
  fileKey: "Yx8cjexd4UmOkLDZHe3jaD",
  nodeIds: "0-1003",
};

const Page: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: Values) => {
    setLoading(true);
    fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({
        ...values,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        message.success("generate page done!");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onFinishFailed = (errorInfo: ValidateErrorEntity<Values>) => {
    message.error(JSON.stringify(errorInfo));
  };

  const handleSelectChange = (platform: string) => {
    form.setFieldValue("platform", platform);
  };

  return (
    <Layout
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <Header
        style={{
          color: "#fff",
        }}
      >
        FIGMA PAGE GENERATE
      </Header>
      <Content
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <Form
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{
            accessToken,
            ...fileConfig1,
            platform: "wechat",
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          style={{
            width: 700,
          }}
        >
          <Form.Item
            label="AccessToken"
            name="accessToken"
            rules={[
              { required: true, message: "please enter figma accessToken!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="FileKey"
            name="fileKey"
            rules={[
              { required: true, message: "please enter figma file key!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="NodeIds"
            name="nodeIds"
            rules={[{ required: true, message: "please enter figma nodeids" }]}
          >
            <Input placeholder="separated by comma" />
          </Form.Item>
          <Form.Item
            label="Platform"
            name="platform"
            rules={[{ required: true, message: "please select platform" }]}
          >
            <Select
              showSearch
              placeholder="Select a platform"
              onChange={handleSelectChange}
            >
              <Option value="pc">PC</Option>
              <Option value="mobile">MOBILE</Option>
              <Option value="wechat">WECHAT</Option>
            </Select>
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Content>
    </Layout>
  );
};

export default Page;
