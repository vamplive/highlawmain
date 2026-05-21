/**
 * UI 프리미티브 — Button/Badge/Card/Input/Select/Textarea/ErrorState 렌더링 테스트
 * variant·size 클래스 주입, className 병합, 이벤트/attribute 전파, 접근성 기본 속성을 검증한다.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { Button } from "../Button";
import { Badge } from "../Badge";
import { Card, CardHeader, CardTitle, CardContent } from "../Card";
import { Input } from "../Input";
import { Select } from "../Select";
import { Textarea } from "../Textarea";
import ErrorState from "../ErrorState";

describe("Button", () => {
  it("children을 렌더한다", () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
  });

  it("기본 variant/size 클래스가 적용된다", () => {
    render(<Button>X</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-[var(--accent-gold)]");
    expect(btn.className).toContain("h-9");
  });

  it("variant=outline이면 border 클래스가 붙는다", () => {
    render(<Button variant="outline">Y</Button>);
    expect(screen.getByRole("button").className).toContain("border");
  });

  it("variant=destructive이면 빨간색 계열 클래스", () => {
    render(<Button variant="destructive">삭제</Button>);
    expect(screen.getByRole("button").className).toContain("bg-red-600");
  });

  it("size=icon이면 정사각형 크기 클래스", () => {
    render(<Button size="icon">•</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-9");
    expect(btn.className).toContain("w-9");
  });

  it("알 수 없는 variant/size는 default로 폴백한다", () => {
    render(<Button variant="unknown" size="huge">Z</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-[var(--accent-gold)]");
    expect(btn.className).toContain("h-9 px-4");
  });

  it("onClick 핸들러가 호출된다", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>클릭</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled 속성이 전파된다", () => {
    render(<Button disabled>N</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("추가 className이 병합된다", () => {
    render(<Button className="my-extra">M</Button>);
    expect(screen.getByRole("button").className).toContain("my-extra");
  });
});

describe("Badge", () => {
  it("children을 span으로 렌더한다", () => {
    render(<Badge>신규</Badge>);
    const el = screen.getByText("신규");
    expect(el.tagName).toBe("SPAN");
  });

  it("variant=secondary 클래스가 적용된다", () => {
    render(<Badge variant="secondary">s</Badge>);
    expect(screen.getByText("s").className).toContain("bg-[var(--bg-secondary)]");
  });

  it("variant=outline이면 border 클래스", () => {
    render(<Badge variant="outline">o</Badge>);
    expect(screen.getByText("o").className).toContain("border");
  });

  it("style prop이 전달된다", () => {
    render(<Badge style={{ color: "rgb(255, 0, 0)" }}>빨강</Badge>);
    expect(screen.getByText("빨강")).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });
});

describe("Card 계열", () => {
  it("Card > Header > Title > Content 조합이 정상 렌더된다", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>제목</CardTitle>
        </CardHeader>
        <CardContent>본문</CardContent>
      </Card>
    );
    expect(screen.getByText("제목").tagName).toBe("H3");
    expect(screen.getByText("본문")).toBeInTheDocument();
  });

  it("Card에 className이 병합된다", () => {
    const { container } = render(<Card className="my-card">x</Card>);
    expect(container.firstChild.className).toContain("my-card");
    expect(container.firstChild.className).toContain("rounded-lg");
  });
});

describe("Input", () => {
  it("placeholder와 value를 받는다", () => {
    render(<Input placeholder="이름" defaultValue="홍길동" />);
    const input = screen.getByPlaceholderText("이름");
    expect(input).toHaveValue("홍길동");
  });

  it("onChange가 동작한다", () => {
    const onChange = vi.fn();
    render(<Input placeholder="x" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("x"), { target: { value: "abc" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("type 속성이 전파된다", () => {
    render(<Input type="email" placeholder="이메일" />);
    expect(screen.getByPlaceholderText("이메일")).toHaveAttribute("type", "email");
  });
});

describe("Select", () => {
  it("option 자식들을 렌더하고 onChange가 동작한다", () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="카테고리" onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    );
    const select = screen.getByLabelText("카테고리");
    fireEvent.change(select, { target: { value: "b" } });
    expect(onChange).toHaveBeenCalled();
    expect(select).toHaveValue("b");
  });
});

describe("Textarea", () => {
  it("여러 줄 입력을 수용한다", () => {
    render(<Textarea placeholder="메모" defaultValue={"첫줄\n둘째줄"} />);
    expect(screen.getByPlaceholderText("메모")).toHaveValue("첫줄\n둘째줄");
  });

  it("rows 속성이 전파된다", () => {
    render(<Textarea placeholder="m" rows={5} />);
    expect(screen.getByPlaceholderText("m")).toHaveAttribute("rows", "5");
  });
});

describe("ErrorState", () => {
  it("기본 문구를 렌더한다 (role=alert)", () => {
    render(<ErrorState />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("콘텐츠를 불러오지 못했습니다")).toBeInTheDocument();
    expect(screen.getByText("잠시 후 다시 시도해 주세요.")).toBeInTheDocument();
  });

  it("title/message 커스텀을 반영한다", () => {
    render(<ErrorState title="네트워크 오류" message="연결을 확인해주세요" />);
    expect(screen.getByText("네트워크 오류")).toBeInTheDocument();
    expect(screen.getByText("연결을 확인해주세요")).toBeInTheDocument();
  });

  it("onRetry가 있으면 '다시 시도' 버튼이 표시되고 클릭 시 호출된다", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    const btn = screen.getByRole("button", { name: "다시 시도" });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("onRetry가 없으면 버튼이 없다", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
