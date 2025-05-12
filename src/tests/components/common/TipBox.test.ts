import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TipBox from "@/components/common/TipBox.vue";

describe("TipBox.vue", () => {
  it("renders the component with default props", () => {
    const wrapper = mount(TipBox);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.classes()).toContain("tip-box");
  });

  it("renders the title when provided", () => {
    const title = "Test Title";
    const wrapper = mount(TipBox, {
      props: { title },
    });
    expect(wrapper.text()).toContain(title);
  });

  it("renders the default slot content", () => {
    const slotContent = "Test content";
    const wrapper = mount(TipBox, {
      slots: {
        default: slotContent,
      },
    });
    expect(wrapper.text()).toContain(slotContent);
  });

  it("applies the correct type class based on prop", () => {
    const types = ["info", "warning", "error", "success"];
    
    types.forEach((type) => {
      const wrapper = mount(TipBox, {
        props: { type },
      });
      expect(wrapper.classes()).toContain(`tip-box--${type}`);
    });
  });

  it("applies the dense class when dense prop is true", () => {
    const wrapper = mount(TipBox, {
      props: { dense: true },
    });
    expect(wrapper.classes()).toContain("tip-box--dense");
  });
});
